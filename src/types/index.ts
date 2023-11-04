import { Document, Schema } from "mongoose";

export interface IApikeyResponse {
  success: boolean;
  usage: number;
  userType: string;
  rateLimit: number;
  remainigLimit: number;
  expirationDate: string;
  details: IApikey;
}
export interface IFeeInfo {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  economyFee: number;
  minimumFee: number;
  lastChecked: Date;
}

export interface IFileSchema {
  file_type: string;
  file_name: string;
  base64_data: string;
  file_size: number;
  inscription_address: string;
  txid?: string;
  leaf: string;
  tapkey: string;
  cblock: string;
  inscription_fee: number;
  inscription_id?: string;
}

export interface IInscribeOrder extends Document {
  order_id: string;
  funding_address: string;
  privkey: string;
  receive_address: string;
  chain_fee: number;
  service_fee: number;
  inscriptions: IFileSchema[];
  cursed: boolean;
  network: "testnet" | "mainnet";
  status:
    | "payment pending"
    | "payment received"
    | "insufficient balance"
    | "inscribed"
    | "refunded";
  webhook_url?: string;
  fee_rate: number;
  txid?: string;
  referrer?: string;
  referral_fee?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface IApikey {
  apiKey: string;
  count: number;
  wallet: string;
  allowedIps: string[];
}

interface Attribute {
  key: string;
  value: string;
}

export interface IInscription {
  inscription_number: number;
  inscription_id: string;
  content?: string;
  sha?: string;
  location?: string;
  output?: string;
  timestamp?: Date;
  children?: any[];
  next?: string;
  previous?: string;
  parent?: string;
  genesis_address?: string;
  genesis_fee?: number;
  genesis_height?: number;
  genesis_transaction?: string;
  flagged?: boolean;
  banned: boolean;
  reason?: string;
  updated_by?: string;
  block?: number;
  content_length?: number;
  content_type?: string;
  official_collection?: Schema.Types.ObjectId;
  collection_item_name?: string;
  collection_item_number?: number;
  attributes?: Attribute[];
  sat_timestamp?: Date;
  cycle?: number;
  decimal?: string;
  degree?: string;
  epoch?: number;
  percentile?: string;
  period?: number;
  rarity?: string;
  sat_number?: number;
  sat_name?: string;
  sat_offset?: number;
  lists?: Schema.Types.ObjectId[];
  tags?: string[];
  error?: boolean;
  error_retry?: number;
  error_tag?: string;
  offset?: number;
  output_value?: number;
  address?: string;
  listed?: boolean;
  listed_at?: Date;
  listed_price?: number;
  listed_maker_fee_bp?: number;
  tap_internal_key?: string;
  listed_seller_receive_address?: string;
  signed_psbt?: string;
  unsigned_psbt?: string;
  sat_block_time?: Date;
  sattributes?: string[];
  last_checked?: Date;
  version?: number;
  token?: boolean;
}
