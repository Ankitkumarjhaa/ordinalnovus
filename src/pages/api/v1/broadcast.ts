// pages/api/order/create.ts
import { NextApiRequest, NextApiResponse } from "next";
import * as bitcoin from "bitcoinjs-lib"
interface APIInput {
  signedPsbt: string;
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
      return response;
    }

    console.log("Transaction successfully broadcasted");
    return response;
  } catch (error) {
    console.error(`Error in broadcastTransaction function: ${error}`);
    throw error;
  }
}



async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{
    ok: Boolean;
    message: string;
    data?: any;
  }>
) {
  console.log("***** BROADCAST API CALLED *****");

  // Ensure the request method is POST
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method Not Allowed" });
  }

  const APIInput: APIInput = req.body;

  const requiredFields = ["signedPsbt"];
  const missingFields = requiredFields.filter(
    (field) => !Object.hasOwnProperty.call(APIInput, field)
  );

  if (missingFields.length > 0) {
    return res.status(400).json({
      ok: false,
      message: `Missing required fields: ${missingFields.join(", ")}`,
    });
  }

  try {
    
    const signedPsbt = bitcoin.Psbt.fromHex(APIInput.signedPsbt);
    for (let i = 0; i < signedPsbt.data.inputs.length; i++) {
      try {
        signedPsbt.finalizeInput(i);
      } catch (e) {
        console.error(e);
      }
    }
    const txHex = signedPsbt.extractTransaction().toHex();
    await broadcastTransaction(txHex).then((response) => {
      console.log(response, 'RESULT')
      res.status(200).json({
        ok: true,
        message: "Broadcasted TX Successfully",
        data: response
      });
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      ok: false,
      message: error.message,
    });
  }
}

export default handler;
