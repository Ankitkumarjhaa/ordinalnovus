export const PROVIDERS = [
  process.env.NEXT_PUBLIC_PROVIDER,
  "https://ordinals.com",
];
export function shortenString(str: string, length?: number): string {
  if (str.length <= (length || 8)) {
    return str;
  }
  const start = str.slice(0, 4);
  const end = str.slice(-4);
  return `${start}...${end}`;
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

import mempoolJS from "@mempool/mempool.js";
import axios from "axios";

const { bitcoin } = mempoolJS({
  hostname: "mempool.space",
  network: "bitcoin",
});

export const mempoolBitcoin = bitcoin;

export async function fetchContentFromProviders(contentId: string) {
  for (const url of PROVIDERS) {
    try {
      const response = await axios.get(`${url}/content/${contentId}`, {
        responseType: "arraybuffer",
      });
      // console.log(" GOT Response from: ", url)
      return response;
    } catch (error) {
      // console.log(error, "error");
      console.warn(`Provider ${url} failed. Trying next.`);
    }
  }
  throw new Error("All providers failed");
}