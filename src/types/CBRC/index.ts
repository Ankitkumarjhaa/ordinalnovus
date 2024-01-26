import { ReactNode } from "react";

interface IOP {
  _id: string;
  id: string;
  n: number;
  h: number;
  fm: number;
  o: number;
  vs: number;
  op: string;
  acc: string;
  success: boolean;
  ctype: string;
  k: string;
}

export interface IHistoricalData {
  marketCap: number;
  date: Date;
  price: number;
  volume: number;
  volume_sats: number;
  on_volume: number;
  on_volume_sats: number;
}
export interface Icbrc {
  fp: ReactNode;
  op: IOP;
  tick: string;
  supply: number;
  max: number;
  lim: number;
  dec: number;
  mint: boolean;
  mintops: string[];
}

export interface ICbrcToken {
  listed: ReactNode;
  in_mempool: number;
  tick: string;
  checksum: string;
  supply: number;
  max: number;
  lim: number;
  dec: number;
  number: number;
  mint: boolean;
  price: number;
  volume: number;
  volume_in_sats: number;
  on_volume: number;
  on_volume_in_sats: number;
  _24h_price_change: number;
  _7d_price_change: number;
  historicalData: IHistoricalData[];
  icon?: string;
}
