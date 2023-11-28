// pages/api/v1/order/createBuyPsbt.ts
import { Inscription } from "@/models";
import dbConnect from "@/lib/dbConnect";
import { NextRequest, NextResponse } from "next/server";
import { fetchLatestInscriptionData } from "@/utils/Marketplace";
import { buyOrdinalPSBT } from "@/utils/Marketplace/Buying";

interface OrderInput {
  inscription_id: string;
  pay_address: string;
  receive_address: string;
  publickey: string;
  fee_rate: number;
  wallet: string;
  signed_psbt: string;
  price: number;
  seller_receive_address: string;
}

// Validate the POST method and necessary fields in the request
function validateRequest(body: OrderInput): string[] {
  const requiredFields = [
    "inscription_id",
    "publickey",
    "pay_address",
    "receive_address",
    "wallet",
    "fee_rate",
    "signed_psbt",
    "price",
    "seller_receive_address",
  ];
  const missingFields = requiredFields.filter((field) => {
    //@ts-ignore
    const value = body[field];
    return (
      value === null ||
      value === undefined ||
      value === "" ||
      (typeof value === "string" && value.trim() === "")
    );
  });

  return missingFields;
}

// Fetch and process the ordItem data
async function processOrdItem(
  inscription_id: string,
  receive_address: string,
  pay_address: string,
  publickey: string,
  wallet: string,
  fee_rate: number,
  signed_psbt: string,
  price: number,
  seller_receive_address: string
) {
  const ordItem: any = await fetchLatestInscriptionData(inscription_id);
  ordItem.signed_psbt = signed_psbt;
  ordItem.listed_price = price;
  ordItem.listed_seller_receive_address = seller_receive_address;
  if (
    ordItem.address &&
    ordItem.signed_psbt &&
    ordItem.listed_price &&
    ordItem.output &&
    ordItem.output_value
  ) {
    const result = await buyOrdinalPSBT(
      pay_address,
      receive_address,
      ordItem,
      ordItem.listed_price,
      publickey,
      wallet,
      fee_rate
    );
    return result;
  } else {
    throw new Error("Ord Provider Unavailable");
  }
}

export async function POST(
  req: NextRequest,
  res: NextResponse<{
    ok: Boolean;
    inscription_id?: string;
    price?: number;
    receive_address?: string;
    pay_address?: string;
    unsigned_psbt_base64?: string;
    input_length: number;
    message: string;
    for?: string;
  }>
) {
  console.log("***** CREATE UNSIGNED BUY PSBT API CALLED *****");

  try {
    const body: OrderInput = await req.json();
    const missingFields = validateRequest(body);

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          message: `Missing required fields: ${missingFields.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const result = await processOrdItem(
      body.inscription_id,
      body.receive_address,
      body.pay_address,
      body.publickey,
      body.wallet,
      body.fee_rate,
      body.signed_psbt,
      body.price,
      body.seller_receive_address
    );

    //buy psbt || dummy utxo psbt
    const psbt = result.data.psbt.buyer
      ? result.data.psbt.buyer.unsignedBuyingPSBTBase64
      : result.data.psbt;

    return NextResponse.json({
      ok: true,
      psbt,
      input_length:
        result.data.for === "dummy"
          ? 1
          : result.data.psbt.buyer.unsignedBuyingPSBTInputSize,
      // ...result,
      inscription_id: body.inscription_id,
      receive_address: body.receive_address,
      pay_address: body.pay_address,
      for: result.data.for,
      message: "Success",
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      {
        ok: false,
        message: error.message || error,
      },
      { status: 500 }
    );
  }
}
