"use server";
// api/fetchCBRCListings.ts
import { IInscription } from "@/types";
import axios from "axios";

export interface FetchInscriptionsParams {
  page_size: number;
  page: number;
  sort?: string;
  tick?: string;
  collection_item_number?: number;
}

export interface InscriptionResponse {
  inscriptions: IInscription[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export async function fetchCBRCListings(
  params: FetchInscriptionsParams
): Promise<{ data: InscriptionResponse; error: string | null } | undefined> {
  const { sort, page_size, page, tick, collection_item_number } = params;
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_URL}/api/v2/cbrc/listings`,
      {
        params: {
          show: "all",
          _sort: sort || "inscription_number:1",
          _limit: page_size,
          _start: (page - 1) * page_size,
          tick,
          collection_item_number,
          apikey: process.env.API_KEY,
        },
      }
    );

    if (response.status === 200) {
      return { data: response.data || [], error: null };
    } else {
      return undefined;
    }
  } catch (error) {
    return undefined;
  }
}
