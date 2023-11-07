"use server";
// apiHelper/CreateApikey.ts
import axios from "axios";

export interface CreateApikeyParams {
  walletId: string;
}

export async function CreateApikey(
  params: CreateApikeyParams
): Promise<{ success: boolean; error: string | null } | undefined> {
  const { walletId } = params;
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_URL}/api/apikey/create`,
      {
        wallet: walletId,
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
