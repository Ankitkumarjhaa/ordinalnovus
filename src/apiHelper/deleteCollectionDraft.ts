"use server";
// apiHelper/deleteCollectionDraft.ts
import { ICollection } from "@/types";
import axios from "axios";

export interface deleteCollectionDraftParams {
  slug: string;
  updated_by: string;
}

export interface CollectionResponse {
  ok: true;
}

export async function deleteCollectionDraft(
  params: deleteCollectionDraftParams
): Promise<{ data?: CollectionResponse; error: string | null } | undefined> {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_URL}/api/v2/creator/collection/delete`,
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
      return { error: ` ${response?.data.message}` };
    }
  } catch (error: any) {
    // Assuming error is of type any. You might want to add more specific type handling
    return {
      error: error?.response.data.message || "An unknown error occurred",
    };
  }
}
