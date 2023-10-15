export interface Order {
  eventId: string;
  network: string;
  type: string;
  inscription: string;
  output: string;
  price: string;
  exchange: string;
  timestamp: number;
  PSBT: string;
  content_type: string;
  number: number;
  address: string;
  offset: number;
  rarity: string;
  valid: boolean;
  sold: boolean;
}
