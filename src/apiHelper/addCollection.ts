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
): Promise<{ data: CollectionResponse; error: string | null } | undefined> {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_URL}/api/v2/collection`,
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
      return undefined;
    }
  } catch (error) {
    return undefined;
  }
}
