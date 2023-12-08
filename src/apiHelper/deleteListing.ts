"use server";
import axios from "axios";

export interface deleteListingdata {
  seller_receive_address: string;
  inscription_id: string;
  tap_internal_key: string;
}

async function deleteListing(
  data: deleteListingdata
): Promise<{ ok: boolean; message: string }> {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_URL}/api/v2/order/delete-listing`,
      data,
      {
        headers: {
          "x-api-key": process.env.API_KEY,
          // You can add other headers here if needed
        },
      }
    );

    if (response.status === 200) {
      return { ok: response.data.ok, message: response.data.message };
    } else {
      throw new Error("Error removing listing");
    }
  } catch (error) {
    console.error(error, "error");
    return {
      ok: false,
      message: "Error removing listing",
    };
  }
}

export default deleteListing;
