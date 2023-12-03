"use server";
// apiHelper/addCollection.ts
import { IAddCollection, ICollection } from "@/types";
import axios from "axios";

interface CollectionResponse {
  ok: boolean;
  result: ICollection;
}

export async function addCollection(
  params: IAddCollection
): Promise<{ data?: CollectionResponse; error: string | null } | undefined> {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_URL}/api/v2/creator/collection/add`,
      params,
      {
        headers: {
          "x-api-key": process.env.API_KEY,
        },
      }
    );

    if (response.status === 200) {
      return { data: response.data, error: null };
    } else {
      // You might want to customize this message or extract more specific info from the response
      return { error: `Request failed with status code: ${response.status}` };
    }
  } catch (error: any) {
    // Assuming error is of type any. You might want to add more specific type handling
    return { error: error?.message || "An unknown error occurred" };
  }
}
