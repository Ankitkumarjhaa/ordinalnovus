import { Schema } from "mongoose";
export interface IVIN {
    txid: string;
    vout: number;
    prevout: IVOUT|null;
    scriptsig: string;
    scriptsig_asm: string;
    witness: string[];
}

export interface IVOUT {
    scriptpubkey: string;
    scriptpubkey_asm: string;
    scriptpubkey_type: string;
    scriptpubkey_address?: string;
    value: number;
}
export interface MempoolBlockTx {
  // existing fields
  txid: string;
  version: number;
  locktime: number;
  vin: Array<IVIN>; // Define a more precise type based on the structure
  vout: Array<IVOUT>; // Define a more precise type based on the structure
  size: number;
  weight: number;
  fee: number;
  status: { confirmed: boolean };
}

export interface ITXCache extends Document {
  // existing fields
  txid: string;
  parsed: boolean;
  inscription: Schema.Types.ObjectId;
  from: string;
  to: string;
  price: number;
  tag: string;

  // new fields
  version: number;
  locktime: number;
  vin: Array<any>; // Define a more precise type based on the structure
  vout: Array<any>; // Define a more precise type based on the structure
  size: number;
  weight: number;
  fee: number;
  status: { confirmed: boolean };
}
