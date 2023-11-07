// app/api/order/create-listing-psbt/route.ts
import * as btc from "micro-btc-signer";
import { hex, base64 } from "@scure/base";
import { NextRequest, NextResponse } from "next/server";
import { getSellerOrdOutputValue } from "@/utils/Marketplace";
import { IInscription } from "@/types/Ordinals";
import { Inscription } from "@/models";
import { CustomError } from "@/utils";

interface OrderInput {
  inscription_id: string;
  price: number; // in sats
  receive_address: string;
  publickey: string;
  maker_fee_bp?: number; // in sats
}

// Validate the POST method and necessary fields in the request
function validateRequest(req: NextRequest, body: OrderInput): string[] {
  const requiredFields = [
    "inscription_id",
    "price",
    "receive_address",
    "publickey",
  ];
  const missingFields = requiredFields.filter(
    (field) => !Object.hasOwnProperty.call(body, field)
  );

  return missingFields;
}

// Fetch and process the ordItem data
async function processOrdItem(
  inscription_id: string,
  address: string,
  price: number, //in sats
  key: string,
  maker_fee_bp?: number
) {
  console.log("finding in db...");
  const ordItem: IInscription | null = await Inscription.findOne({
    inscription_id,
  });
  console.log(ordItem, "ORDITEM");
  if (!ordItem) throw new CustomError("Item hasn't been added to our DB", 404);
  const publickey = hex.decode(key);

  const p2tr = btc.p2tr(publickey, undefined, btc.NETWORK);
  const tx = new btc.Transaction({});

  if (ordItem.address && ordItem.output && ordItem.output_value) {
    const [ordinalUtxoTxId, ordinalUtxoVout] = ordItem.output.split(":");

    // Define the input for the PSBT
    tx.addInput({
      txid: ordinalUtxoTxId,
      index: parseInt(ordinalUtxoVout),
      //   nonWitnessUtxo: tx.toBuffer(),
      witnessUtxo: {
        script: p2tr.script,
        amount: BigInt(ordItem.output_value),
      },
      tapInternalKey: publickey,
      sighashType: btc.SignatureHash.SINGLE | btc.SignatureHash.ANYONECANPAY,
    });

    // Add input and output to the PSBT
    tx.addOutputAddress(
      address,
      BigInt(getSellerOrdOutputValue(price, maker_fee_bp, ordItem.output_value))
    );

    const unsignedPsbtBase64 = base64.encode(tx.toPSBT(0));
    return unsignedPsbtBase64;
  } else {
    throw new Error("Ord Provider Unavailable");
  }
}

export async function POST(
  req: NextRequest,
  res: NextResponse<{
    ok: Boolean;
    tokenId?: string;
    price?: number;
    receive_address?: string;
    unsigned_psbt_base64?: string;
    message: string;
  }>
) {
  console.log("***** CREATE UNSIGNED PSBT API CALLED *****");
  try {
    const body: OrderInput = await req.json();
    const missingFields = validateRequest(req, body);

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          message: `Missing required fields: ${missingFields.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const unsignedPsbtBase64 = await processOrdItem(
      body.inscription_id,
      body.receive_address,
      Math.floor(body.price),
      body.publickey,
      body.maker_fee_bp
    );
    return NextResponse.json({
      ok: true,
      tokenId: body.inscription_id,
      price: Math.floor(body.price),
      receive_address: body.receive_address,
      unsigned_psbt_base64: unsignedPsbtBase64,
      message: "Success",
    });
  } catch (error: any) {
    console.log(error, "error");
    if (!error?.status) console.error("Catch Error: ", error);
    return NextResponse.json(
      { message: error.message || error || "Error fetching inscriptions" },
      { status: error.status || 500 }
    );
  }
}
