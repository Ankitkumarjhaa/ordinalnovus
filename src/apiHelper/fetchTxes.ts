"use server";
// api/fetchTxes.ts
import { ITransaction } from "@/types";
import axios from "axios";

export interface FetchTxParams {
  page_size: number;
  page: number;
  sort?: string;
  tag?: string;
  parsed?: boolean;
  metaprotocol?: string;
  tick?: string;
}

export interface TXResponse {
  txes: ITransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export async function fetchTxes(
  params: FetchTxParams
): Promise<{ data: TXResponse; error: string | null } | undefined> {
  const {
    sort,
    page_size,
    page,
    tag,
    parsed = 10,
    tick,
    metaprotocol,
  } = params;
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_URL}/api/v2/txes`,
      {
        params: {
          _sort: sort,
          page_size,
          tag,
          parsed,
          metaprotocol,
          tick,
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
