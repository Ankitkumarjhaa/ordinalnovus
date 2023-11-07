"use server";
import { IApikeyResponse } from "@/types";
// apiHelper/FetchApikey.ts
import axios from "axios";

export interface FetchApikeyParams {
  walletId: string;
}

export async function FetchApikey(
  params: FetchApikeyParams
): Promise<
  { success: boolean; data: IApikeyResponse; error: string | null } | undefined
> {
  const { walletId } = params;
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_URL}/api/apikey/${walletId}`
    );

    if (response.status === 200) {
      return { success: true, data: response.data, error: null };
    } else {
      return undefined;
    }
  } catch (error) {
    return undefined;
  }
}
