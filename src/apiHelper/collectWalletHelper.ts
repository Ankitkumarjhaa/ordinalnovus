"use server";
// apiHelper/collectWalletHelper.ts
import axios from "axios";

export interface CollectWalletParams {
  ordinal_address: string;
  cardinal_address: string;
  ordinal_pubkey: string;
  cardinal_pubkey: string;
  wallet: string;
}

export async function CollectWallet(
  params: CollectWalletParams
): Promise<{ success: boolean; error: string | null } | undefined> {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_URL}/api/analytics/collect-wallets`,
      params,
      {
        headers: {
          "x-api-key": process.env.API_KEY,
        },
      }
    );

    if (response.status === 200) {
      return { success: true, error: null };
    } else {
      return { success: false, error: "Failed to create apikey" };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.response.data.message || error.message || error,
    };
  }
}
