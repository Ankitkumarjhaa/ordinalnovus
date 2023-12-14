import mongoose, { Document, Schema } from "mongoose";
import * as bitcoin from "bitcoinjs-lib";

export interface ISat {
  number: number;
  decimal: string;
  degree: string;
  name: string;
  block: number;
  cycle: number;
  epoch: number;
  period: number;
  offset: number;
  rarity: string;
  percentile: string;
  satpoint: null;
  timestamp: number;
  inscriptions: IInscription[];
}

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
  trait_type: string;
  value: string;
}

export interface IInscription {
  _id: string;
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
  official_collection?: ICollection;
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

  sat?: number;
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
  in_mempool: boolean;
  txid: string;
  sat_block_time?: Date;
  sattributes?: string[];
  last_checked?: Date;
  version?: number;
  token?: boolean;
  domain_valid?: boolean;

  // v12.1.3
  metadata?: Map<string, string>;
  metaprotocol?: string;
  parsed_metaprotocol?: string[];
  charms?: number;
  cbrc_valid?: boolean;
}

export interface Holder {
  address: string;
  count: number;
}
// Type aliases for repeated types
type BlockchainType = "btc" | "ltc" | "doge";
type CollectionType = "official" | "list";

// Base interface for common properties
export interface ICollectionBase {
  name: string;
  slug: string;
  description: string;
  blockchain: BlockchainType;
  type: CollectionType;
  tags?: string[];
  email?: string;
  discord_id?: string;
  json_uploaded?: boolean;
}

// Interface for adding a new collection
export interface IAddCollection extends ICollectionBase {
  inscription_icon?: string;
  icon?: string;
  supply?: number;
  twitter_link?: string;
  discord_link?: string;
  website_link?: string;
  live: boolean;
  verified: boolean;
  updated_by: string;
}

// Interface for the collection document
export interface ICollection extends ICollectionBase, Document {
  _id: string;
  inscription_icon?: IInscription;
  icon?: string;
  supply?: number;
  twitter_link?: string;
  discord_link?: string;
  website_link?: string;
  live?: boolean;
  featured?: boolean;
  flagged?: boolean;
  banned?: boolean;
  verified?: boolean;
  updated_by?: string;
  favorites: string[];
  updated?: number;
  errored?: number;
  error?: boolean;
  errored_inscriptions: string[];
  error_tag?: string;
  min?: number;
  max?: number;
  priority?: number;
  created_at?: Date;
  updated_at?: Date;
  holders_check?: Date;
  holders: Holder[];
  holders_count: number;
  listed?: number;
  fp?: number;
}

export interface ISale extends Document {
  inscription: Schema.Types.ObjectId;
  inscription_id: string;
  official_collection?: Schema.Types.ObjectId;
  collection_item_name?: string;
  collection_item_number?: number;
  offset?: number;
  output_value?: number;
  output: string;
  location: string;
  address?: string;
  sold_at?: Date;
  fee?: number;
  seller_tap_internal_key?: string;
  listed_seller_receive_address?: string;
  signed_seller_psbt: string;
  signed_buyer_psbt: string;
  buyer_payment_address: string;
  buyer_ordinal_address: string;
  buyer_tap_internal_key: string;
  price: number;
  price_in_usd: number;
  tx: string;
  status: "confirmed" | "rejected" | "mempool";
  created_at?: Date;
  updated_at?: Date;
}

export interface RecentInscription {
  inscriptionId: string;
  title: string;
  number: number;
  content_type: string;
  content?: string;
}

export type TransactionInput = {
  txid: string;
};
export type Transaction = {
  txid?: string;
  vin: TransactionInput[];
  fee: number;
  weight: number;
  feeRate?: string;
};

export interface UTXO {
  status: {
    block_hash: string;
    block_height: number;
    block_time: number;
    confirmed: boolean;
  };
  txid: string;
  value: number;
  vout: number;
  tx: bitcoin.Transaction;
}

export interface AddressTxsUtxo {
  status: {
    block_hash: string;
    block_height: number;
    block_time: number;
    confirmed: boolean;
  };
  txid: string;
  value: number;
  vout: number;
}

export interface WalletDetail {
  cardinal: string;
  ordinal: string;
}

export interface WitnessUtxo {
  script: Buffer;
  value: number;
}

export interface IListingState {
  seller: {
    makerFeeBp: number;
    sellerOrdAddress: string;
    price: number;
    ordItem: IInscription;
    sellerReceiveAddress: string;
    unsignedListingPSBTBase64?: string;
    signedListingPSBTBase64?: string;
    tapInternalKey?: string;
  };

  buyer: {
    takerFeeBp: number;
    buyerAddress: string;
    buyerTokenReceiveAddress: string;
    fee_rate: number;
    buyerPublicKey: string;
    unsignedBuyingPSBTBase64?: string;
    unsignedBuyingPSBTInputSize?: number;
    signedBuyingPSBTBase64?: string;
    buyerDummyUTXOs?: UTXO[];
    buyerPaymentUTXOs?: AddressTxsUtxo[]; // after the selection
    mergedSignedBuyingPSBTBase64?: string;
  };
}

export type FeeRateTier =
  | "fastestFee"
  | "halfHourFee"
  | "hourFee"
  | "economyFee";
