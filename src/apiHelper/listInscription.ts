"use server";
import axios from "axios";

export interface listInscriptionData {
  seller_receive_address: string;
  inscription_id: string;
  price: number; //sats
  unsigned_listing_psbt_base64: string;
  tap_internal_key: string;
  signed_listing_psbt_base64: string;
}

async function listInscription(
  data: listInscriptionData
): Promise<{ ok: boolean; message: string }> {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_URL}/api/v2/order/list-item`,
      data,
      {
        headers: {
          "x-api-key": process.env.API_KEY, // Add your API key here in the headers
          // You can add other headers here if needed
        },
      }
    );

    if (response.status === 200) {
      return { ok: response.data.ok, message: response.data.message };
    } else {
      throw new Error("Error posting order");
    }
  } catch (error) {
    console.error(error, "error");
    return {
      ok: false,
      message: "Error listing ordinal",
    };
  }
}

export default listInscription;
