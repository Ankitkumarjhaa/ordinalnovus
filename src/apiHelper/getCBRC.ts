"use server";
import { Icbrc } from "@/types/CBRC";
import axios from "axios";

export interface FetchCBRCParams {
  mode: "deploy" | "mint" | "transfer";
  sort: string;
  offset: number;
  search?: string;
}

export interface InscriptionResponse {
  items: Icbrc[];
  count: number;
  limit: number;
}

export async function FetchCBRC(
  params: FetchCBRCParams
): Promise<{ data: InscriptionResponse; error: string | null } | undefined> {
  const { mode, sort, offset, search } = params;
  console.debug({ params });
  try {
    let url = `https://api.cybord.org/${mode}`;
    if (search) url = `https://api.cybord.org/tokens`;
    const response = await axios.get(url, {
      params: {
        order: sort,
        offset,
        q: search,
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
