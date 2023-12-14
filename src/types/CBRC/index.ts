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
export interface Icbrc {
  op: IOP;
  tick: string;
  supply: number;
  max: number;
  lim: number;
  dec: number;
  mint: boolean;
  mintops: string[];
}
