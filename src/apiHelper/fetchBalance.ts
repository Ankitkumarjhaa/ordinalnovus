"use server";

import axios from "axios";

export interface FetchBalParams {
  address: string;
}

export interface BalRes {
  balance: number;
  mempool_balance: number;
  dummyUtxos: number;
}

export async function fetchBalance(
  params: FetchBalParams
): Promise<{ data: BalRes; error: string | null } | undefined> {
  const { address } = params;
  try {
    const url = `${process.env.NEXT_PUBLIC_URL}/api/utils/balance`;
    const response = await axios.get(url, {
      params: { address, apikey: process.env.API_KEY },
    });

    if (response.status === 200) {
      return { data: response.data, error: null };
    } else {
      return undefined;
    }
  } catch (error) {
    console.log({ error }, "bal err");
    return undefined;
  }
}
