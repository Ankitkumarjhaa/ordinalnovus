"use server";
import axios from "axios";

interface CreateBuyingPsbtData {
  inscription_id: string;
  pay_address: string;
  receive_address: string;
  publickey: string;
  wallet: string;
}

async function getUnsignedPsbt(data: CreateBuyingPsbtData): Promise<{
  ok: boolean;
  message: string;
  for?: string;
  unsigned_psbt_base64?: string;
}> {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_URL}/api/v2/order/createBuyPsbt?apiKey=${process.env.API_KEY}`,
      data
    );

    if (response.status === 200) {
      return {
        ok: response.data.ok,
        message: response.data.message,
        unsigned_psbt_base64: response.data.unsignedPsbtBase64,
        for: response.data.data.for,
      };
    } else {
      throw new Error("Error generating unsigned PSBT");
    }
  } catch (error) {
    return {
      ok: false,
      message: "Error generating unsigned PSBT",
    };
  }
}

export default getUnsignedPsbt;
