"use server";
import axios from "axios";

interface CreateListingPsbtData {
  inscription_id: string;
  price: number;
  receive_address: string;
  wallet: string;
  publickey?: string;
}

async function getUnsignedListingPsbt(data: CreateListingPsbtData): Promise<{
  ok: boolean;
  message: string;
  unsigned_psbt_base64?: string;
  tap_internal_key?: string;
}> {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_URL}/api/v2/order/create-listing-psbt`,
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
        tap_internal_key: response.data.tap_internal_key,
      };
    } else {
      throw new Error("Error generating unsigned PSBT");
    }
  } catch (error: any) {
    console.error(error, "ERROr");
    return {
      ok: false,
      message: error.response.data.message || "Error generating unsigned PSBT",
    };
  }
}

export default getUnsignedListingPsbt;
