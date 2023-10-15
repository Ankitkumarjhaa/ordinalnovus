export interface WalletDetails {
  cardinal: string;
  cardinalPubkey?: string;
  ordinal: string;
  ordinalPubkey?: string;
}

export interface WalletState {
  walletDetails: WalletDetails | null;
  lastWallet: string;
}

