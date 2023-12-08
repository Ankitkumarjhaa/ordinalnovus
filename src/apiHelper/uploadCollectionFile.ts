"use server";
import axios from "axios";

interface CollectionResponse {
  ok: boolean;
  result: any;
}

export async function uploadCollectionFile(
  formData: FormData
): Promise<{ data: CollectionResponse; error: string | null } | undefined> {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_URL}/api/v2/creator/collection/upload`, // Ensure this matches your endpoint
      formData,
      {
        headers: {
          "x-api-key": process.env.API_KEY, // Add any required headers here
        },
      }
    );

    if (response.status === 200) {
      return { data: response.data, error: null };
    } else {
      // Customize error message based on response
      // console.log({ response }, "Response");
      return {
        data: { ok: false, result: null },
        error:
          response.data.error ||
          `Request failed with status code: ${response.status}`,
      };
    }
  } catch (error: any) {
    // console.log({ error: error.response.data.message }, "Error");
    return {
      data: { ok: false, result: null },
      error: error?.response?.data?.message || "An unknown error occurred",
    };
  }
}
