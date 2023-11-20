"use server";
import axios from "axios";

interface CreateBuyingPsbtData {
  inscription_id: string;
  pay_address: string;
  receive_address: string;
  publickey: string;
  wallet: string;
  fee_rate: number;
}

async function getUnsignedPsbt(data: CreateBuyingPsbtData): Promise<{
  ok: boolean;
  message: string;
  for?: string;
  unsigned_psbt_base64?: string;
}> {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_URL}/api/v2/order/create-buying-psbt`,
      data,
      {
        headers: {
          "x-api-key": process.env.API_KEY, // Add your API key here in the headers
          // You can add other headers here if needed
        },
      }
    );

    if (response.status === 200) {
      return {
        ok: response.data.ok,
        message: response.data.message,
        unsigned_psbt_base64: response.data.unsigned_psbt_base64,
        for: response.data.for,
      };
    } else {
      throw new Error("Error generating unsigned PSBT");
    }
  } catch (error: any) {
    console.log(error, "error");
    return {
      ok: false,
      message: error.response.data.message || "Error generating unsigned PSBT",
    };
  }
}

export default getUnsignedPsbt;