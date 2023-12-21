// Utils.ts

import axios from "axios";

// ----------------------------
// File Operations
// ----------------------------

// Helper function to promisify FileReader
export const readFile = (file: File) => {
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
};

export const bytesToHex = (bytes: Uint8Array) => {
  return bytes.reduce(
    (str, byte) => str + byte.toString(16).padStart(2, "0"),
    ""
  );
};

export const textToHex = (text: string) => {
  var encoder = new TextEncoder().encode(text);
  return [...new Uint8Array(encoder)]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
};

export const hexToBytes = (hex: string) => {
  const matches = hex.match(/.{1,2}/g);
  if (!matches) {
    throw new Error("Invalid hex string");
  }
  return Uint8Array.from(matches.map((byte) => parseInt(byte, 16)));
};

// ----------------------------
// Network Operations
// ----------------------------

const mempoolNetwork = (network: string) =>
  network === "mainnet" ? "" : "testnet/";

export const getMaxFeeRate = async () => {
  try {
    const { data } = await axios.get(
      `https://blockstream.info/${mempoolNetwork(
        "mainnet"
      )}api/v1/fees/recommended`
    );
    if ("fastestFee" in data) {
      return data.fastestFee;
    }
    throw new Error("fastestFee not found in response data");
  } catch (error) {
    console.error(error);
    return "error -- site down or data format changed";
  }
};

export const getMinFeeRate = async () => {
  let fees = await axios.get(
    `https://blockstream.info/${mempoolNetwork(
      "mainnet"
    )}api/v1/fees/recommended`
  );
  fees = fees.data;
  if (!("minimumFee" in fees)) return "error -- site down";
  let minfee = fees["minimumFee"];
  return minfee;
};

export const addressReceivedMoneyInThisTx = async (
  address: string,
  network: string
) => {
  let txid, vout, amt, input_address, vsize;
  let { data } = await axios.get(
    `https://blockstream.info/${mempoolNetwork(
      network
    )}api/address/${address}/txs`
  );
  let json = data;
  // console.dir(json, { depth: null });

  json.forEach(function (tx: {
    vin: any;
    weight: number;
    vout: { scriptpubkey_address: string; value: any }[];
    txid: any;
  }) {
    const vins = tx.vin;
    vsize = tx.weight / 4;
    input_address = null; // This will store the first encountered address

    for (let vin of vins) {
      // Store the first address encountered
      if (!input_address) {
        input_address = vin.prevout.scriptpubkey_address;
      }

      // If we find a v0_p2wpkh address, return it immediately
      if (vin.prevout.scriptpubkey_type === "v0_p2wpkh") {
        input_address = vin.prevout.scriptpubkey_address;
      }
    }
    tx.vout.forEach(function (
      output: { scriptpubkey_address: string; value: any },
      index: any
    ) {
      if (output.scriptpubkey_address === address) {
        txid = tx.txid;
        vout = index;
        amt = output.value;
      }
    });
  });

  return [txid, vout, amt, input_address, vsize];
};

export const satsToDollars = async (sats: number) => {
  // Fetch the current bitcoin price from session storage
  const bitcoin_price = await getBitcoinPriceFromCoinbase();
  // Convert satoshis to bitcoin, then to USD
  const value_in_dollars = (sats / 100_000_000) * bitcoin_price;
  return value_in_dollars;
};

export const getBitcoinPriceFromCoinbase = async () => {
  var { data } = await axios.get(
    "https://api.coinbase.com/v2/prices/BTC-USD/spot"
  );
  var price = data.data.amount;
  return price;
};

export const getBitcoinPrice = async () => {
  var prices = [];
  var cbprice = await getBitcoinPriceFromCoinbase();
  prices.push(Number(cbprice));
  prices.sort();
  return prices[0];
};

export async function addressOnceHadMoney(
  address: string,
  network: string,
  min_balance: number
) {
  var url =
    `https://blockstream.info/${mempoolNetwork(network)}api/address/` + address;
  var { data } = await axios.get(url);
  var json = data;
  if (
    json["chain_stats"]["tx_count"] > 0 ||
    json["mempool_stats"]["tx_count"] > 0
  ) {
    const bal =
      json.chain_stats.funded_txo_sum +
      json.mempool_stats.funded_txo_sum -
      (json.chain_stats.spent_txo_sum + json.mempool_stats.spent_txo_sum);
    if (bal > min_balance) {
      return true;
    } else throw Error("Low Balance");
  }
  return false;
}

export async function pushBTCpmt(rawtx: string, network: string) {
  const url = `https://blockstream.info/${mempoolNetwork(network)}api/tx`;
  try {
    const response = await axios.post(url, rawtx);
    return response.data; // or response.data.txid if the txid is in the data object
  } catch (error) {
    throw error; // Rethrow the error to handle it in the caller function
  }
}

// ----------------------------
// Miscellaneous Functions
// ----------------------------

export const generateRandomHex = (length: number) => {
  const characters = "0123456789abcdef";
  let result = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }
  return result;
};

// Loop function has been omitted due to redundancy and potential infinite loop risks.
// It can be refactored using modern async/await patterns and better error handling if needed.
