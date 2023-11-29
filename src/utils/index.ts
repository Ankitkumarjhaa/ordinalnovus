export function shortenString(str: string, length?: number): string {
  if (str.length <= (length || 8)) {
    return str;
  }
  const start = str.slice(0, 4);
  const end = str.slice(-4);
  return `${start}...${end}`;
}
export function wait(seconds = 10) {
  return new Promise((resolve) => {
    setTimeout(resolve, seconds * 1000);
  });
}

export const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
};

export class CustomError extends Error {
  status: number;

  constructor(message: string, status: number = 500) {
    super(message);
    this.status = status;
  }
}

export const formattedJsonString = (item: any) => {
  if (typeof item === "string") {
    return item.replace(/[\n\r]/g, "\\n");
  }

  return JSON.stringify(
    item,
    (key, value) => {
      if (typeof value === "string") {
        return value.replace(/[\n\r]/g, "\\n");
      }
      return value;
    },
    2
  );
};

import { AppDispatch } from "@/stores";
import { setFees } from "@/stores/reducers/generalReducer";
import mempoolJS from "@mempool/mempool.js";
import axios from "axios";
import moment from "moment";

const { bitcoin } = mempoolJS({
  hostname: "mempool.space",
  network: "bitcoin",
});

export const mempoolBitcoin = bitcoin;

export const determineTypesFromId = (id: string): string[] => {
  // Check if ID is a positive number
  if (!isNaN(Number(id)) && Number(id) < 0) {
    return ["inscription number"];
  }

  if (!isNaN(Number(id)) && Number(id) > 0) {
    return ["inscription number", "sat"];
  }

  // Check if ID is an inscription_id
  const inscriptionRegex = /[0-9a-fA-F]{64}i[0-9]+$/;
  if (inscriptionRegex.test(id)) {
    return ["inscription id"];
  }

  // Check if ID is a sha
  const shaRegex = /^[0-9a-fA-F]{64}$/;
  if (shaRegex.test(id)) {
    return ["sha"];
  }

  // Check for strings ending with ' token'
  const tokenRegex = /\btoken$/i;
  if (tokenRegex.test(id)) {
    return ["token"];
  }

  if (/(\d+\.bitmap)$/.test(id)) {
    return ["bitmap"];
  }

  // Add a new check for string.string pattern
  const stringDotStringRegex = /^[a-zA-Z0-9]+\.[a-zA-Z0-9]+$/;
  if (stringDotStringRegex.test(id)) {
    return ["domain"];
  }

  // Check if ID is a normal string without special characters
  const normalStringRegex = /^[a-zA-Z0-9]*$/;
  if (normalStringRegex.test(id)) {
    return ["collection", "sat name", "content"];
  }

  // Fallback for normal strings
  return ["collection", "content"];
};

export async function getBTCPriceInDollars() {
  try {
    const response = await fetch(
      "https://api.coindesk.com/v1/bpi/currentprice/BTC.json"
    );
    const data = await response.json();
    const priceInDollars = data.bpi.USD.rate_float;
    return priceInDollars;
  } catch (error) {
    console.error("Error fetching BTC price:", error);
    return null;
  }
}

export function calculateBTCCostInDollars(btcAmount: number, btcPrice: number) {
  if (
    typeof btcAmount !== "number" ||
    typeof btcPrice !== "number" ||
    btcAmount < 0
  ) {
    throw new Error(
      "Invalid input. Both arguments should be positive numbers."
    );
  }

  const btcCostInDollars = btcAmount * btcPrice;
  return btcCostInDollars.toFixed(2);
}

export const fetchFees = async (dispatch: AppDispatch) => {
  try {
    const response = await axios.get(
      "https://mempool.space/api/v1/fees/recommended"
    );
    const data = response.data;
    data.lastChecked = moment();
    dispatch(setFees(response.data));
  } catch (error) {
    console.error("Error fetching fees:", error);
  }
};

// Function to convert price from satoshi to Bitcoin
export const convertSatToBtc = (priceInSat: number) => {
  return priceInSat / 100000000; // 1 BTC = 100,000,000 SAT
};

export function convertBtcToSat(priceInSat = 0): number {
  return priceInSat * 1e8; // 1 BTC = 100,000,000 SAT
}

export function ecdsaPublicKeyToSchnorr(pubKey: Uint8Array) {
  if (pubKey.byteLength !== 33) throw new Error("Invalid public key length");
  return pubKey.slice(1);
}

export function base64ToHex(str: string) {
  return atob(str)
    .split("")
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("");
}

export function base64ToBytes(base64: string) {
  const buffer = Buffer.from(base64, "base64");
  return new Uint8Array(buffer);
}
