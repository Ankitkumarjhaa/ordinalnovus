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
    pageSize = 12,
    page = 1,
  } = params;
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_URL}/api/v2/collection`,
      {
        params: {
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
