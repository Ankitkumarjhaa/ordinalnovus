"use server";
// api/inscription.ts
import { ICollection } from "@/types";
import axios from "axios";

export interface FetchCollectionParams {
  slug?: string;
  collectionId?: string;
  sort?: string;
  search?: string;
  pageSize?: number;
  page?: number;
  wallet?: string;
  json_uploaded?: boolean;
  live: boolean;
}

export interface CollectionResponse {
  collections: ICollection[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export async function fetchCollections(
  params: FetchCollectionParams
): Promise<{ data: CollectionResponse; error: string | null } | undefined> {
  const {
    collectionId,
    slug,
    sort = "name:1",
    search,
    pageSize = 100,
    page = 1,
    wallet,
    json_uploaded,
    live,
  } = params;
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_URL}/api/v2/collection`,
      {
        params: {
          updated_by: wallet,
          json_uploaded,
          live,
          slug,
          collectionId,
          _sort: sort,
          search,
          _limit: pageSize,
          _start: (page - 1) * pageSize,
          apikey: process.env.API_KEY,
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
