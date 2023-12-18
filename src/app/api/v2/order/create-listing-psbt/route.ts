// app/api/order/create-listing-psbt/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  getSellerOrdOutputValue,
  getTxHexById,
  toXOnly,
} from "@/utils/Marketplace";
import { IInscription } from "@/types";
import { Inscription } from "@/models";
import { CustomError, ecdsaPublicKeyToSchnorr } from "@/utils";
import dbConnect from "@/lib/dbConnect";
import * as bitcoin from "bitcoinjs-lib";
import secp256k1 from "@bitcoinerlab/secp256k1";

bitcoin.initEccLib(secp256k1);
interface OrderInput {
  inscription_id: string;
  price: number; // in sats
  wallet: "Leather" | "Xverse" | "Unisat";
  receive_address: string;
  publickey: string;
  maker_fee_bp?: number; // in sats
}

// Validate the POST method and necessary fields in the request
function validateRequest(req: NextRequest, body: OrderInput): string[] {
  const requiredFields = [
    "inscription_id",
    "price",
    "wallet",
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
  publickey: string,
  wallet: string,
  maker_fee_bp?: number
) {
  let psbt = new bitcoin.Psbt({ network: undefined });
  await dbConnect();
  const ordItem: IInscription | null = await Inscription.findOne({
    inscription_id,
  });
  console.log(ordItem, "ORDITEM");
  if (!ordItem) throw new CustomError("Item hasn't been added to our DB", 404);

  const taprootAddress =
    ordItem && ordItem?.address && ordItem?.address.startsWith("bc1p");

  if (ordItem.address && ordItem.output && ordItem.output_value) {
    const [ordinalUtxoTxId, ordinalUtxoVout] = ordItem.output.split(":");

    // Define the input for the PSBT
    const tx = bitcoin.Transaction.fromHex(await getTxHexById(ordinalUtxoTxId));

    if (!publickey) {
      for (const output in tx.outs) {
        try {
          tx.setWitness(parseInt(output), []);
        } catch {}
      }
    }

    const input: any = {
      hash: ordinalUtxoTxId,
      index: parseInt(ordinalUtxoVout),
      nonWitnessUtxo: tx.toBuffer(),
      witnessUtxo: tx.outs[Number(ordinalUtxoVout)],
      sighashType:
        bitcoin.Transaction.SIGHASH_SINGLE |
        bitcoin.Transaction.SIGHASH_ANYONECANPAY,
    };
    if (taprootAddress) {
      input.tapInternalKey = toXOnly(
        tx.toBuffer().constructor(publickey, "hex")
      );
    }

    console.log({ tapInternalKey: input.tapInternalKey, publickey });

    psbt.addInput(input);
    psbt.addOutput({
      address: address,
      value: getSellerOrdOutputValue(price, maker_fee_bp, ordItem.output_value),
    });

    const unsignedPsbtBase64 = psbt.toBase64();
    return {
      unsignedPsbtBase64,
      tap_internal_key: taprootAddress ? input.tapInternalKey.toString() : "",
    };
  } else {
    console.debug({
      address: ordItem.address,
      output: ordItem.output,
      output_value: ordItem.output_value,
    });
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

    const { unsignedPsbtBase64, tap_internal_key } = await processOrdItem(
      body.inscription_id,
      body.receive_address,
      Math.floor(body.price),
      body.publickey,
      body.wallet,
      body.maker_fee_bp
    );
    return NextResponse.json({
      ok: true,
      inscription_id: body.inscription_id,
      price: Math.floor(body.price),
      receive_address: body.receive_address,
      unsigned_psbt_base64: unsignedPsbtBase64,
      tap_internal_key,
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
