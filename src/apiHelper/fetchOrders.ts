"use server";
// api/inscription.ts
import { IInscribeOrder } from "@/types";
import axios from "axios";

export interface FetchOrderParams {
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
}

export interface OrderResponse {
  orders: IInscribeOrder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export async function fetchOrders(
  params: FetchOrderParams
): Promise<{ data: OrderResponse; error: string | null } | undefined> {
  const { sort, page_size, page, wallet } = params;
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_URL}/api/v2/inscribe/order`,
      {
        params: {
          receive_address: wallet,
          _sort: sort || "createdAt:-1",
          _limit: page_size,
          _start: (page - 1) * page_size,
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
