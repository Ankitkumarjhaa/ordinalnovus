// pages/api/v1/order/createBuyPsbt.ts
// import { fetchLatestInscriptionData } from "@/utils/marketplace";
import * as bitcoin from "bitcoinjs-lib";
import secp256k1 from "@bitcoinerlab/secp256k1";
import { Inscription } from "@/models";
import dbConnect from "@/lib/dbConnect";
import { NextRequest, NextResponse } from "next/server";
import { fetchLatestInscriptionData } from "@/utils/Marketplace";
import { buyOrdinalPSBT } from "@/utils/Marketplace/Buying";
bitcoin.initEccLib(secp256k1);

interface OrderInput {
  inscription_id: string;
  pay_address: string;
  receive_address: string;
  publickey: string;
  fee_rate: number;
  wallet: string;
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
  fee_rate: number
) {
  const ordItem: any = await fetchLatestInscriptionData(inscription_id);
  //   console.log("got ordItem", ordItem);
  await dbConnect();
  const dbItem: any | null = await Inscription.findOne({
    inscription_id,
    listed: true,
  });

  console.log("got db listing", dbItem);

  if (!dbItem.address) {
    throw Error("Item not listed in db");
  }

  if (ordItem.address !== dbItem.address || dbItem.output !== ordItem.output) {
    dbItem.listed = false;
    dbItem.listed_price = 0;
    dbItem.address = ordItem.address;
    dbItem.output = ordItem.output;
    dbItem.location = ordItem.location;
    dbItem.offset = ordItem.offset;
    dbItem.output_value = ordItem.output_value;
    dbItem.signed_psbt = "";
    dbItem.unsigned_psbt = "";
    dbItem.tap_internal_key = "";
    dbItem.save();
    throw Error("PSBT Expired");
  }
  if (
    ordItem.address &&
    dbItem.signed_psbt &&
    dbItem.listed_price &&
    ordItem.output &&
    ordItem.output_value
  ) {
    const result = await buyOrdinalPSBT(
      pay_address,
      receive_address,
      dbItem,
      dbItem.listed_price,
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
      body.fee_rate
    );

    //buy psbt || dummy utxo psbt
    const psbt = result.data.psbt.buyer
      ? result.data.psbt.buyer.unsignedBuyingPSBTBase64
      : result.data.psbt;

    return NextResponse.json({
      ok: true,
      unsigned_psbt_base64: psbt,
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
