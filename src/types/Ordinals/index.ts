import * as bitcoin from "bitcoinjs-lib";
// Static Fields
export interface IInscription {
  _id: any;
  inscriptionId?: string;
  content?: string;
  sha?: string;
  officialCollection?: ICollection;
  name?: string;
  attributes?: any;
  preview?: string;
  flagged?: boolean;
  banned?: boolean;
  reason?: string;
  updated_by?: string;
  block?: number;
  content_length?: number;
  content_type?: string;
  cycle?: number;
  decimal?: string;
  degree?: string;
  epoch?: number;
  genesis_address?: string;
  genesis_fee?: number;
  genesis_height?: number;
  genesis_transaction?: string;
  location?: string;
  number: number; //required
  percentile?: string;
  period?: number;
  rarity?: string;
  sat?: number;
  sat_name?: string;
  timestamp?: Date;

  // Dynamic Fields
  sat_offset?: number;
  lists?: ICollection[];
  tags?: string[]; // Lowercase letters and hyphens only
  error?: boolean;

  // New Fields
  offset?: number;
  output?: string;
  output_value?: number;
  address?: string;
  listed?: boolean;
  listedAt?: Date;
  listedPrice?: number; //in sats
  listedMakerFeeBp?: number;
  listedSellerReceiveAddress?: string;
  signedPsbt?: string;
  unSignedPsbt?: string;
  satBlockTime?: Date;
  sattributes?: string[];
  lastChecked?: Date;
  tapInternalKey?: string;

  // Timestamp Fields
  created_at?: Date;
  updated_at?: Date;
  version: Number;
}

export interface ICollection {
  _id: string;
  name: string;
  inscription_icon: IInscription;
  supply: number;
  slug: string;
  description: string;
  discord_link?: string;
  twitter_link?: string;
  website_link?: string;
  live: boolean;
  featured: boolean;
  blockchain: string;
  flagged: boolean;
  banned: boolean;
  verified: boolean;
  type: string;
  tags: Array<string>;
  favourites: Array<string>;
  updated: number;
  priority: number;
  min?: number;
  max?: number;
}

export interface ISat {
  _links: any;
  block: number;
  cycle: number;
  decimal: string;
  degree: string;
  epoch: number;
  name: string;
  offset: number;
  percentile: string;
  period: number;
  rarity: string;
  timestamp: string;
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

  buyer?: {
    takerFeeBp: number;
    buyerAddress: string;
    buyerTokenReceiveAddress: string;
    feeRateTier: string;
    buyerPublicKey?: string;
    unsignedBuyingPSBTBase64?: string;
    unsignedBuyingPSBTInputSize?: number;
    signedBuyingPSBTBase64?: string;
    buyerDummyUTXOs?: UTXO[];
    buyerPaymentUTXOs?: AddressTxsUtxo[] ; // after the selection
    mergedSignedBuyingPSBTBase64?: string;
  };
}

export type FeeRateTier =
  | "fastestFee"
  | "halfHourFee"
  | "hourFee"
  | "economyFee";
