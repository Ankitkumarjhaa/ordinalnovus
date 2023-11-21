import * as bitcoin from "bitcoinjs-lib";
import { IInscription } from "..";

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
