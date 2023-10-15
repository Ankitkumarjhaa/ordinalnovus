// pages/api/order/createListingPsbt.ts
import { NextApiRequest, NextApiResponse } from "next";
import * as bitcoin from "bitcoinjs-lib";
import apiKeyMiddleware from "@/middlewares/apiKeyMiddleware";
import { mergeSignedBuyingPSBTBase64 } from "@/utils/Marketplace/Buying";

interface OrderInput {
  signedListingPSBTBase64: string;
  signedBuyingPSBTBase64: string;
}
async function broadcastTransaction(rawTx: string): Promise<Response> {
  const url = "https://mempool.space/api/tx";
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
  };
  const body = rawTx;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: body,
    });

    if (!response.ok) {
      console.error(`Error broadcasting transaction: ${response.statusText}`);
      throw Error(" Error ");
    }

    console.log("Transaction successfully broadcasted");
    return response;
  } catch (error) {
    console.error(`Error in broadcastTransaction function: ${error}`);
    throw error;
  }
}

// Validate the POST method and necessary fields in the request
function validateRequest(req: NextApiRequest, body: OrderInput): string[] {
  if (req.method !== "POST") {
    throw new Error("Method Not Allowed");
  }

  const requiredFields = ["signedListingPSBTBase64", "signedBuyingPSBTBase64"];
  const missingFields = requiredFields.filter(
    (field) => !Object.hasOwnProperty.call(body, field)
  );

  return missingFields;
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{
    ok: Boolean;
    message: string;
    data?: any;
  }>
) {
  console.log("***** MERGE SIGNED PSBT API CALLED *****");

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

      const psbtBase64 = mergeSignedBuyingPSBTBase64(
        body.signedListingPSBTBase64,
        body.signedBuyingPSBTBase64
      );
      console.log(psbtBase64, "FINAL PSBT WITH ALL SIG");

      const signedPsbt = bitcoin.Psbt.fromBase64(psbtBase64);
      for (let i = 0; i < signedPsbt.data.inputs.length; i++) {
        try {
          signedPsbt.finalizeInput(i);
        } catch (e) {
          console.error(e, "error finalizing");
        }
      }
      const txHex = signedPsbt.extractTransaction().toHex();
      res.status(200).json({
        ok: true,
        message: "Broadcasted TX Successfully",
        data: txHex,
      });

      // await broadcastTransaction(txHex).then(async (result) => {
      //   console.log(result, "BROADCAST RESULT");
      //   console.log(await result.text(), "BROADCAST RESULT DATA");
      //   res.status(200).json({
      //     ok: true,
      //     message: "Broadcasted TX Successfully",
      //     data: result,
      //   });
      // });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        ok: false,
        message: error.message,
      });
    }
  });
}

export default handler;
