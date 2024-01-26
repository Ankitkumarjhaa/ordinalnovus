"use server";
// Utils.ts
import * as bitcoin from "bitcoinjs-lib";
import secp256k1 from "@bitcoinerlab/secp256k1";
import axios from "axios";
import {
  DUMMY_UTXO_MIN_VALUE,
  DUMMY_UTXO_VALUE,
  selectPaymentUTXOs,
} from "../Marketplace/Buying";
import {
  calculateTxBytesFeeWithRate,
  doesUtxoContainInscription,
  getTxHexById,
  getUtxosByAddress,
  mapUtxos,
  toXOnly,
} from "../Marketplace";
import { AddressTxsUtxo } from "@mempool/mempool.js/lib/interfaces/bitcoin/addresses";
import { ICreateInscription, IInscribeOrder, IInscription } from "@/types";
import dbConnect from "@/lib/dbConnect";
import { Inscription } from "@/models";

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
      `https://mempool.space/${mempoolNetwork(
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
    `https://mempool.space/${mempoolNetwork("mainnet")}api/v1/fees/recommended`
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
    `https://mempool-api.ordinalnovus.com/address/${address}/txs`
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
    `https://mempool-api.ordinalnovus.com/${mempoolNetwork(network)}address/` +
    address;

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
  const url = `https://mempool-api.ordinalnovus.com/tx`;
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

export async function generateUnsignedPsbtForInscription(
  payment_address: string,
  publickey: string | undefined,
  fee_rate: number,
  wallet: string,
  inscriptions: ICreateInscription[],
  order: IInscribeOrder,
  inscription_id?: string,
  ordinal_publickey?: string
) {
  let payerUtxos: AddressTxsUtxo[];
  let paymentUtxos: AddressTxsUtxo[] | undefined;
  try {
    payerUtxos = await getUtxosByAddress(payment_address);
  } catch (e) {
    console.error(e);
    return Promise.reject("Mempool error");
  }

  try {
    paymentUtxos = await selectPaymentUTXOs(
      payerUtxos,
      order.chain_fee + order.service_fee + 10000,
      Math.floor(Math.random() * 3) + 3, // number between 3-5
      inscriptions.length + 2,
      fee_rate
    );

    if (!paymentUtxos) throw Error("Balance not enough");

    let psbt = null;
    let inputs = null; // Assuming inputs is not declared elsewhere

    if (inscription_id && ordinal_publickey) {
      ({ psbt, inputs } =
        await generateReinscriptionUnsignedPsbtForInscriptionPSBTBase64(
          payment_address,
          publickey,
          paymentUtxos,
          fee_rate,
          wallet,
          inscriptions,
          order,
          inscription_id,
          ordinal_publickey
        ));
    } else {
      psbt = await generateUnsignedPsbtForInscriptionPSBTBase64(
        payment_address,
        publickey,
        paymentUtxos,
        fee_rate,
        wallet,
        inscriptions,
        order
      );
    }
    console.log({ psbt, inputs });
    return { psbt, inputs };
  } catch (err: any) {
    throw Error(err);
  }
}

async function generateUnsignedPsbtForInscriptionPSBTBase64(
  payment_address: string,
  publickey: string | undefined,
  unqualifiedUtxos: AddressTxsUtxo[],
  fee_rate: number,
  wallet: string,
  inscriptions: ICreateInscription[],
  order: IInscribeOrder
): Promise<string> {
  wallet = wallet?.toLowerCase();
  bitcoin.initEccLib(secp256k1);

  const psbt = new bitcoin.Psbt({ network: undefined });
  const [mappedUnqualifiedUtxos, recommendedFee] = await Promise.all([
    mapUtxos(unqualifiedUtxos),
    fee_rate,
  ]);

  // Loop the unqualified utxos until we have enough to create a dummy utxo
  let totalValue = 0;
  let paymentUtxoCount = 0;

  const taprootAddress = payment_address.startsWith("bc1p");
  for (const utxo of mappedUnqualifiedUtxos) {
    if (await doesUtxoContainInscription(utxo)) {
      continue;
    }
    const tx = bitcoin.Transaction.fromHex(await getTxHexById(utxo.txid));

    const input: any = {
      hash: utxo.txid,
      index: utxo.vout,
      ...(taprootAddress && {
        nonWitnessUtxo: utxo.tx.toBuffer(),
      }),
    };

    if (!taprootAddress) {
      const redeemScript = bitcoin.payments.p2wpkh({
        pubkey: Buffer.from(publickey!, "hex"),
      }).output;
      const p2sh = bitcoin.payments.p2sh({
        redeem: { output: redeemScript },
      });

      if (wallet !== "unisat") {
        input.witnessUtxo = tx.outs[utxo.vout];
        if (wallet === "xverse") input.redeemScript = p2sh.redeem?.output;
      } else {
        // unisat wallet should not have redeemscript for buy tx (for native segwit)
        input.witnessUtxo = tx.outs[utxo.vout];
        // if (!payment_address.startsWith("bc1q")) {
        //   input.redeemScript = p2sh.redeem?.output;
        // }
      }
    } else {
      // unisat
      input.witnessUtxo = utxo.tx.outs[utxo.vout];
      input.tapInternalKey = toXOnly(
        utxo.tx.toBuffer().constructor(publickey, "hex")
      );
    }

    psbt.addInput(input);
    totalValue += utxo.value;
    paymentUtxoCount += 1;

    const fees = calculateTxBytesFeeWithRate(
      paymentUtxoCount,
      inscriptions.length + 1, // inscription + service fee output
      fee_rate
    );
    if (totalValue >= DUMMY_UTXO_VALUE * 2 + fees) {
      break;
    }
  }

  const finalFees = calculateTxBytesFeeWithRate(
    paymentUtxoCount,
    inscriptions.length + 1, // inscription + service fee output
    fee_rate
  );

  console.log({ totalValue, finalFees });
  const changeValue =
    totalValue -
    (order.chain_fee + order.service_fee) -
    Math.floor(fee_rate < 150 ? finalFees / 1.5 : finalFees / 1.3);
  console.log({ changeValue });

  // We must have enough value to create a dummy utxo and pay for tx fees
  if (changeValue < 0) {
    throw new Error(
      `You might have pending transactions or not enough fund to complete tx at the provided FeeRate`
    );
  }

  inscriptions.map((i: ICreateInscription) => {
    psbt.addOutput({
      address: i.inscription_address,
      value: i.inscription_fee,
    });
  });
  psbt.addOutput({
    address: "bc1qqv48lhfhqjz8au3grvnc6nxjcmhzsuucj80frr",
    value: order.service_fee,
  });

  // to avoid dust
  if (changeValue > DUMMY_UTXO_MIN_VALUE) {
    psbt.addOutput({
      address: payment_address,
      value: changeValue,
    });
  }

  console.log("psbt made");

  return psbt.toBase64();
}

async function generateReinscriptionUnsignedPsbtForInscriptionPSBTBase64(
  payment_address: string,
  publickey: string | undefined,
  unqualifiedUtxos: AddressTxsUtxo[],
  fee_rate: number,
  wallet: string,
  inscriptions: ICreateInscription[],
  order: IInscribeOrder,
  inscription_id: string,
  ordinal_publickey: string
): Promise<{ psbt: string; inputs: number }> {
  await dbConnect();
  const ordItem: IInscription | null = await Inscription.findOne({
    inscription_id,
  });

  if (ordItem?.offset !== 0) {
    throw Error("Inscription offset isn't zero.");
  }
  const ordinalTaprootAddress =
    ordItem && ordItem?.address && ordItem?.address.startsWith("bc1p");
  let ordinalUtxoTxId, ordinalUtxoVout;

  if (!ordItem) throw Error("Item hasn't been added to our DB");
  if (ordItem.address && ordItem.output && ordItem.output_value) {
    [ordinalUtxoTxId, ordinalUtxoVout] = ordItem.output.split(":");
  }

  if (!ordinalUtxoTxId) throw Error("No Ordinal found");
  wallet = wallet?.toLowerCase();
  bitcoin.initEccLib(secp256k1);

  const psbt = new bitcoin.Psbt({ network: undefined });

  const tx = bitcoin.Transaction.fromHex(await getTxHexById(ordinalUtxoTxId));

  if (!publickey) {
    for (const output in tx.outs) {
      try {
        tx.setWitness(parseInt(output), []);
      } catch {}
    }
  }

  const input: any = {
    hash: ordinalUtxoTxId,
    index: parseInt(ordinalUtxoVout || "0"),
    nonWitnessUtxo: tx.toBuffer(),
    witnessUtxo: tx.outs[Number(ordinalUtxoVout)],
  };
  if (ordinalTaprootAddress) {
    input.tapInternalKey = toXOnly(
      tx.toBuffer().constructor(ordinal_publickey, "hex")
    );
  }

  psbt.addInput(input);

  const [mappedUnqualifiedUtxos, recommendedFee] = await Promise.all([
    mapUtxos(unqualifiedUtxos),
    fee_rate,
  ]);

  // Loop the unqualified utxos until we have enough to create a dummy utxo
  let totalValue = 0;
  let paymentUtxoCount = 0;

  const taprootAddress = payment_address.startsWith("bc1p");
  for (const utxo of mappedUnqualifiedUtxos) {
    if (await doesUtxoContainInscription(utxo)) {
      continue;
    }
    const tx = bitcoin.Transaction.fromHex(await getTxHexById(utxo.txid));

    const input: any = {
      hash: utxo.txid,
      index: utxo.vout,
      ...(taprootAddress && {
        nonWitnessUtxo: utxo.tx.toBuffer(),
      }),
    };

    if (!taprootAddress) {
      const redeemScript = bitcoin.payments.p2wpkh({
        pubkey: Buffer.from(publickey!, "hex"),
      }).output;
      const p2sh = bitcoin.payments.p2sh({
        redeem: { output: redeemScript },
      });

      if (wallet !== "unisat") {
        input.witnessUtxo = tx.outs[utxo.vout];
        if (wallet === "xverse") input.redeemScript = p2sh.redeem?.output;
      } else {
        // unisat wallet should not have redeemscript for buy tx (for native segwit)
        input.witnessUtxo = tx.outs[utxo.vout];
        // if (!payment_address.startsWith("bc1q")) {
        //   input.redeemScript = p2sh.redeem?.output;
        // }
      }
    } else {
      // unisat
      input.witnessUtxo = utxo.tx.outs[utxo.vout];
      input.tapInternalKey = toXOnly(
        utxo.tx.toBuffer().constructor(publickey, "hex")
      );
    }

    psbt.addInput(input);
    totalValue += utxo.value;
    paymentUtxoCount += 1;

    const fees = calculateTxBytesFeeWithRate(
      paymentUtxoCount,
      inscriptions.length + 1, // inscription + service fee output
      fee_rate
    );
    if (totalValue >= DUMMY_UTXO_VALUE * 2 + fees) {
      break;
    }
  }

  const finalFees = calculateTxBytesFeeWithRate(
    paymentUtxoCount,
    inscriptions.length + 1, // inscription + service fee output
    fee_rate
  );

  console.log({ totalValue, finalFees });
  let changeValue =
    totalValue -
    (order.chain_fee + order.service_fee) -
    Math.floor(fee_rate < 150 ? finalFees / 1.5 : finalFees / 1.3);

  if (ordItem.output_value && ordItem.output_value > 3000) {
    changeValue = changeValue + ordItem.output_value - 3000;
  }

  // We must have enough value to create a dummy utxo and pay for tx fees
  if (changeValue < 0) {
    throw new Error(
      `You might have pending transactions or not enough fund to complete tx at the provided FeeRate`
    );
  }

  inscriptions.map((i: ICreateInscription) => {
    psbt.addOutput({
      address: i.inscription_address,
      value: i.inscription_fee,
    });
  });
  psbt.addOutput({
    address: "bc1qqv48lhfhqjz8au3grvnc6nxjcmhzsuucj80frr",
    value: order.service_fee,
  });

  // to avoid dust
  if (changeValue > DUMMY_UTXO_MIN_VALUE) {
    psbt.addOutput({
      address: payment_address,
      value: changeValue,
    });
  }

  console.log("psbt made");

  return { psbt: psbt.toBase64(), inputs: psbt.inputCount };
}
