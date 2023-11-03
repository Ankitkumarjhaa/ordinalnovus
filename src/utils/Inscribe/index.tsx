import axios from "axios";

// Helper function to promisify FileReader
export const readFile = (file: any) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
};

export const getMaxFeeRate = async () => {
  try {
    const { data } = await axios.get(
      `https://mempool.space/${mempoolNetwork}api/v1/fees/recommended`
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

export function bytesToHex(bytes: any) {
  return bytes.reduce(
    (str, byte) => str + byte.toString(16).padStart(2, "0"),
    ""
  );
}

export const getMinFeeRate = async () => {
  let fees = await axios.get(
    `https://mempool.space/${mempoolNetwork}api/v1/fees/recommended`
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
  let txid;
  let vout;
  let amt;

  const mempoolNetwork = network === "mainnet" ? "" : "testnet/";
  let { data } = await axios.get(
    `https://mempool.space/${mempoolNetwork}api/address/${address}/txs`
  );
  let json = data;
  json.forEach(function (tx) {
    tx.vout.forEach(function (output, index) {
      if (output.scriptpubkey_address == address) {
        txid = tx.txid;
        vout = index;
        amt = output.value;
      }
    });
  });
  return [txid, vout, amt];
};

// Conversion Functions
export const satsToDollars = async (sats: number) => {
  // Ensure 'sats' value is within Bitcoin's satoshi range
  sats = sats >= 100_000_000 ? sats * 10 : sats;

  // Fetch the current bitcoin price from session storage
  const bitcoin_price = await getBitcoinPriceFromCoinbase();

  // Convert satoshis to bitcoin, then to USD
  const value_in_dollars = (sats / 100_000_000) * bitcoin_price;

  return value_in_dollars;
};

export const textToHex = (text: string) => {
  var encoder = new TextEncoder().encode(text);
  return [...new Uint8Array(encoder)]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
};

export const hexToBytes = (hex: string) => {
  return Uint8Array.from(
    hex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
  );
};

// Miscellaneous Functions
export const generateRandomHex = (length: number) => {
  const characters = "0123456789abcdef";
  let result = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }
  return result;
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
  const mempoolNetwork = network === "mainnet" ? "" : "testnet/";
  var url = `https://mempool.space/${mempoolNetwork}api/address/` + address;
  var { data } = await axios.get(url);

  var json = data;
  // console.log(json, "JSON");
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

export async function loopTilAddressReceivesMoney(
  address: string,
  network: string
) {
  var itReceivedMoney = false;
  async function isDataSetYet(data_i_seek) {
    return new Promise(function (resolve, reject) {
      if (!data_i_seek) {
        setTimeout(async function () {
          console.log(
            `waiting for address to receive money at  ${address} ...`
          );
          itReceivedMoney = await addressOnceHadMoney(address, network);
          var msg = await isDataSetYet(itReceivedMoney);
          resolve(msg);
        }, 2000);
      } else {
        resolve(data_i_seek);
      }
    });
  }
  async function getTimeoutData() {
    var data_i_seek = await isDataSetYet(itReceivedMoney);
    return data_i_seek;
  }
  var returnable = await getTimeoutData();
  return returnable;
}

export async function pushBTCpmt(rawtx: string, network: string) {
  const mempoolNetwork = network === "mainnet" ? "" : "testnet/";
  const url = `https://mempool.space/${mempoolNetwork}api/tx`;

  try {
    const response = await axios.post(url, rawtx);
    return response.data; // or response.data.txid if the txid is in the data object
  } catch (error) {
    // console.error(error.response.data);
    throw error; // Rethrow the error to handle it in the caller function
  }
}
