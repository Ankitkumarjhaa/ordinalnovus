"use server";
import { ICbrcToken } from "@/types/CBRC";
import axios from "axios";

export interface FetchCBRCParams {
  sort?: string;
  search?: string;
  allowed?: boolean;
  page_size: number;
  page: number;
}

export interface CBRCTokenResponse {
  tokens: ICbrcToken[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export async function FetchCBRC(
  params: FetchCBRCParams
): Promise<{ data: CBRCTokenResponse; error: string | null } | undefined> {
  console.debug({ params });
  const { sort, search, page, page_size, allowed } = params;
  try {
    let url = `${process.env.NEXT_PUBLIC_URL}/api/v2/cbrc`;
    const response = await axios.get(url, {
      params: {
        _sort: sort,
        _limit: page_size,
        _start: (page - 1) * page_size,
        search,
        allowed,
        apikey: process.env.API_KEY,
      },
    });

    if (response.status === 200) {
      return { data: response.data || [], error: null };
    } else {
      return undefined;
    }
  } catch (error) {
    return undefined;
  }
}

// Objecttapleaf: "347a451fb8e7b0dfab3646ffe8e937842bd3cb1c508aa043fdef39e3a781b6b2"[[Prototype]]: Object
// Crafter-E3pY58e0.js:1 Objecttcblock: "c010ee8629a097ea8db334e0bb781a23ef1c423f08462b6f468bf3ae684af05590"tpubkey: "f7e1b19be31a074cb10898d4b023d5f41b30e69d4f33ec9525eb767f4c1961c7"[[Prototype]]: Object
// Crafter-E3pY58e0.js:1 Objecttpubkey: "f7e1b19be31a074cb10898d4b023d5f41b30e69d4f33ec9525eb767f4c1961c7"[[Prototype]]: Object 'main'
