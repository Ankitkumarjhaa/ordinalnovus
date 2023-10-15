// pages/api/order/createListingPsbt.ts
import { NextApiRequest, NextApiResponse } from "next";
import {
  fetchLatestInscriptionData,
  getSellerOrdOutputValue,
  getTxHexById,
  toXOnly,
} from "@/utils/Marketplace";
import { IInscription } from "@/types/Ordinals";
import * as bitcoin from "bitcoinjs-lib";
import secp256k1 from "@bitcoinerlab/secp256k1";
import apiKeyMiddleware from "@/middlewares/apiKeyMiddleware";

bitcoin.initEccLib(secp256k1);

interface OrderInput {
  tokenId: string;
  price: number; //in sats
  receive_address: string;
  publickey: string;
  makerFee?: number; //in sats
}

// Validate the POST method and necessary fields in the request
function validateRequest(req: NextApiRequest, body: OrderInput): string[] {
  if (req.method !== "POST") {
    throw new Error("Method Not Allowed");
  }

  const requiredFields = ["tokenId", "price", "receive_address", "publickey"];
  const missingFields = requiredFields.filter(
    (field) => !Object.hasOwnProperty.call(body, field)
  );

  return missingFields;
}

// Fetch and process the ordItem data
async function processOrdItem(
  tokenId: string,
  address: string,
  price: number, //in sats
  makerFee?: number,
  publickey?: string
) {
  const ordItem: IInscription = await fetchLatestInscriptionData(tokenId);
  let psbt = new bitcoin.Psbt({ network: undefined });

  if (ordItem.address && ordItem.output && ordItem.output_value) {
    const [ordinalUtxoTxId, ordinalUtxoVout] = ordItem.output.split(":");
    const tx: any = bitcoin.Transaction.fromHex(
      await getTxHexById(ordinalUtxoTxId)
    );

    // No need to add this witness if the seller is using taproot
    if (!publickey) {
      for (const output in tx.outs) {
        try {
          tx.setWitness(parseInt(output), []);
        } catch {}
      }
    }

    // Define the input for the PSBT
    const input: any = {
      hash: ordinalUtxoTxId,
      index: parseInt(ordinalUtxoVout),
      nonWitnessUtxo: tx.toBuffer(),
      witnessUtxo: tx.outs[ordinalUtxoVout],
      sighashType:
        bitcoin.Transaction.SIGHASH_SINGLE |
        bitcoin.Transaction.SIGHASH_ANYONECANPAY,
    };

    // If taproot is used, we need to add the internal key
    if (publickey) {
      input.tapInternalKey = toXOnly(
        tx.toBuffer().constructor(publickey, "hex")
      );
    }

    console.log({tapInternalKey: input.tapInternalKey, publickey});

    // Add input and output to the PSBT
    psbt.addInput(input);
    psbt.addOutput({
      address: address,
      value: getSellerOrdOutputValue(price, makerFee, ordItem.output_value),
    });

    const unsignedPsbtBase64 = psbt.toBase64();
    return unsignedPsbtBase64;
  } else {
    throw new Error("Ord Provider Unavailable");
  }
}



async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{
    ok: Boolean;
    tokenId?: string;
    price?: number;
    receive_address?: string;
    unsignedPsbtBase64?: string;
    message: string;
  }>
) {
  console.log("***** CREATE UNSIGNED PSBT API CALLED *****");

  await apiKeyMiddleware(["order"], "write")(req, res, async () => {
    try {
      const body: OrderInput = req.body;
      const missingFields = validateRequest(req, body);

      if (missingFields.length > 0) {
        return res.status(400).json({
          ok: false,
          message: `Missing required fields: ${missingFields.join(", ")}`,
        });
      }


      const unsignedPsbtBase64 = await processOrdItem(
        body.tokenId,
        body.receive_address,
        Math.floor(body.price),
        body.makerFee,
        body.publickey
      );
      res.status(200).json({
        ok: true,
        tokenId: body.tokenId,
        price: Math.floor(body.price),
        receive_address: body.receive_address,
        unsignedPsbtBase64,
        message: "Success",
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        ok: false,
        tokenId: req.body.tokenId,
        price: req.body.price,
        message: error.message,
      });
    }
  });
}

export default handler;
