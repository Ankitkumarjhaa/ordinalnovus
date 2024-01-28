// pages/api/v1/order/createBuyPsbt.ts
import { Inscription, SatCollection } from "@/models";
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
  price: number; //in_sats
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
    "price",
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
  expected_price: number
) {
  const ordItem: any = await fetchLatestInscriptionData(inscription_id);
  await dbConnect();
  const dbItem: any | null = await Inscription.findOne({
    inscription_id,
    listed: true,
  }).populate("official_collection");

  const sat_item = await SatCollection.findOne({ sat: dbItem.sat }).populate(
    "official_collection"
  );
  if (sat_item) {
    dbItem.official_collection = sat_item.official_collection;
  }

  console.log("got db listing");

  if (!dbItem || !dbItem.address) {
    throw Error("Item not listed in db");
  }

  if (dbItem.in_mempool) {
    throw Error("Item bought by someone else!!");
  }

  if (
    (ordItem && ordItem.address && ordItem.address !== dbItem.address) ||
    dbItem.output !== ordItem.output
  ) {
    dbItem.listed = false;
    dbItem.listed_price = 0;
    dbItem.address = ordItem.address;
    dbItem.output = ordItem.output;
    dbItem.location = ordItem.location;
    dbItem.offset = ordItem.offset;
    dbItem.output_value = ordItem.output_value;
    dbItem.in_mempool = false;
    dbItem.signed_psbt = "";
    dbItem.unsigned_psbt = "";
    dbItem.tap_internal_key = "";
    dbItem.save();
    throw Error("PSBT Expired");
  }
  if (dbItem.listed_price !== expected_price) {
    console.log({ price: dbItem.listed_price, expected_price });
    throw Error("Item Price has been updated. Refresh Page.");
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
      body.price
    );

    //buy psbt || dummy utxo psbt
    const psbt = result.data.psbt.buyer
      ? result.data.psbt.buyer.unsignedBuyingPSBTBase64
      : result.data.psbt;

    return NextResponse.json({
      ok: true,
      unsigned_psbt_base64: psbt,
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
