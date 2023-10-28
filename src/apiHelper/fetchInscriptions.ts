"use server";
// api/inscription.ts
import { IInscription } from "@/types/Ordinals";
import axios from "axios";

export interface FetchInscriptionsParams {
  page_size: number;
  page: number;
  slug?: string;
  collection_id?: string;
  sort?: string;
  search?: string;
  wallet?: string;
}

export interface InscriptionResponse {
  inscriptions: IInscription[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export async function fetchInscriptions(
  params: FetchInscriptionsParams
): Promise<{ data: InscriptionResponse; error: string | null } | undefined> {
  const {
    collection_id,
    slug,
    sort = "name:1",
    search,
    page_size,
    page,
    wallet,
  } = params;
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_URL}/api/v2/inscription`,
      {
        params: {
          official_collection: collection_id,
          address: wallet,
          slug,
          _sort: sort || "timestamp:1",
          name: search,
          _limit: page_size,
          _start: (page - 1) * page_size,
          apikey: process.env.API_KEY,
        },
      }
    );

    console.log(response.data, "RESPONSE");

    if (response.status === 200) {
      return { data: response.data || [], error: null };
    } else {
      return undefined;
    }
  } catch (error) {
    return undefined;
  }
}
