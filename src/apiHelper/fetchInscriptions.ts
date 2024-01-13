"use server";
// api/inscription.ts
import { IInscription } from "@/types";
import axios from "axios";

export interface FetchInscriptionsParams {
  page_size: number;
  page: number;
  slug?: string;
  collection_id?: string;
  sort?: string;
  search?: string;
  wallet?: string;
  collection_item_number?: string;
  tag?: string;
  attributes?: string;
  type?: string;
  listed?: boolean;
  metaprotocol?: string;
  inscription_number?: number;
  inscription_id?: string;
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
    sort,
    search,
    page_size,
    page,
    wallet,
    collection_item_number,
    tag,
    attributes,
    type,
    listed,
    metaprotocol,
    inscription_number,
    inscription_id,
  } = params;
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_URL}/api/v2/inscription`,
      {
        params: {
          official_collection: collection_id,
          address: wallet,
          show: "all",
          slug,
          _sort: sort || "inscription_number:1",
          q: search,
          type,
          ...(attributes && { attributes }),
          _limit: page_size,
          _start: (page - 1) * page_size,
          tag,
          listed,
          ...(inscription_id && { inscription_id }),
          ...(inscription_number && { inscription_number }),
          ...(metaprotocol && { metaprotocol }),
          ...(collection_item_number && { collection_item_number }),
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
