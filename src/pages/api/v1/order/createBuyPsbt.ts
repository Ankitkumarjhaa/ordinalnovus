// pages/api/v1/order/createBuyPsbt.ts
import { NextApiRequest, NextApiResponse } from "next";
import { fetchLatestInscriptionData } from "@/utils/Marketplace";
import { IInscription } from "@/types/Ordinals";
import * as bitcoin from "bitcoinjs-lib";
import secp256k1 from "@bitcoinerlab/secp256k1";
import apiKeyMiddleware from "@/middlewares/apiKeyMiddleware";
import { buyOrdinalPSBT } from "@/utils/Marketplace/Buying";
import { Inscription } from "@/models";

bitcoin.initEccLib(secp256k1);

interface OrderInput {
  tokenId: string;
  pay_address: string;
  receive_address: string;
  publickey: string;
}

// Validate the POST method and necessary fields in the request
function validateRequest(req: NextApiRequest, body: OrderInput): string[] {
  if (req.method !== "POST") {
    throw new Error("Method Not Allowed");
  }

  const requiredFields = ["tokenId", "publickey", "pay_address"];
  const missingFields = requiredFields.filter(
    (field) => !Object.hasOwnProperty.call(body, field)
  );

  return missingFields;
}

// Fetch and process the ordItem data
async function processOrdItem(
  tokenId: string,
  receive_address: string,
  pay_address: string,
  publickey: string
) {
  const ordItem: IInscription = await fetchLatestInscriptionData(tokenId);
  const dbItem: IInscription | null = await Inscription.findOne({
    inscriptionId: tokenId,
  });
  let psbt = new bitcoin.Psbt({ network: undefined });

  if (!dbItem || ordItem.address !== dbItem.address) {
    throw Error("Address dont match");
  }
  if (
    ordItem.address &&
    dbItem.signedPsbt &&
    dbItem.listedPrice &&
    ordItem.output &&
    ordItem.output_value
  ) {
    const result = await buyOrdinalPSBT(
      pay_address,
      receive_address,
      dbItem,
      dbItem.listedPrice,
      publickey
    );
    return result;
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
    pay_address?: string;
    unsignedPsbtBase64?: string;
    message: string;
  }>
) {
  console.log("***** CREATE UNSIGNED BUY PSBT API CALLED *****");

  await apiKeyMiddleware(["order"], "read")(req, res, async () => {
    try {
      const body: OrderInput = req.body;
      const missingFields = validateRequest(req, body);

      if (missingFields.length > 0) {
        return res.status(400).json({
          ok: false,
          message: `Missing required fields: ${missingFields.join(", ")}`,
        });
      }

      const result = await processOrdItem(
        body.tokenId,
        body.receive_address,
        body.pay_address,
        body.publickey
      );

      //buy psbt || dummy utxo psbt
      const psbt = result.data.psbt.buyer
        ? result.data.psbt.buyer.unsignedBuyingPSBTBase64
        : result.data.psbt;

      res.status(200).json({
        ok: true,
        ...result,
        tokenId: body.tokenId,
        // price: Math.floor(price),
        receive_address: body.receive_address,
        pay_address: body.pay_address,
        unsignedPsbtBase64: psbt,
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
