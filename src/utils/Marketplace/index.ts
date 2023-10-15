//bitcoin
import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";

import { mempoolBitcoin } from "..";

//types
import {
  AddressTxsUtxo,
  FeeRateTier,
  IInscription,
  UTXO,
} from "@/types/Ordinals";

//others
import axios from "axios";

export const baseMempoolApiUrl = `https://mempool.space/api`;
const feeLevel: FeeRateTier = "halfHourFee";

// TODO: This function fetches the latest inscription data for the provided tokenId
async function fetchLatestInscriptionData(
  tokenId: string
): Promise<IInscription> {
  const url = `${process.env.NEXT_PUBLIC_PROVIDER}/api/inscription/${tokenId}`;

  try {
    const response = await axios.get(url);
    const data: IInscription = response.data;
    return data;
  } catch (error: any) {
    throw new Error(`Failed to fetch data: ${error.response.data}`);
  }
}

function validatePsbt(signedPsbt: string) {
  try {
    // Initialize the bitcoinjs-lib library with secp256k1
    bitcoin.initEccLib(ecc);
    let currentPsbt: any;

    if (/^[0-9a-fA-F]+$/.test(signedPsbt)) {
      // If the input is in hex format, create Psbt from hex
      currentPsbt = bitcoin.Psbt.fromHex(signedPsbt);
    } else {
      // If the input is in base64 format, create Psbt from base64
      currentPsbt = bitcoin.Psbt.fromBase64(signedPsbt);
    }

    console.log(currentPsbt, "CPSBT");
    console.log(
      currentPsbt.validateSignaturesOfInput(0, schnorrValidator),
      "CURRENTPSBT"
    );

    const validator = currentPsbt.data.inputs[0].tapInternalKey
      ? schnorrValidator
      : ecdsaValidator;
    const isValid = currentPsbt.validateSignaturesOfInput(0, validator);
    return isValid;
  } catch (error) {
    // Handle the error here
    console.error("Error while validating PSBT:", error);
    // You can return false, throw a custom error, or handle the error in any way you prefer.
    return false;
  }
}

function schnorrValidator(
  pubkey: Buffer,
  msghash: Buffer,
  signature: Buffer
): boolean {
  return ecc.verifySchnorr(msghash, pubkey, signature);
}

function ecdsaValidator(
  pubkey: Buffer,
  msghash: Buffer,
  signature: Buffer
): boolean {
  return ecc.verify(msghash, signature, pubkey);
}

type TxId = string | number;
const txHexByIdCache: Record<TxId, string> = {};

async function getTxHexById(txId: TxId): Promise<string> {
  if (!txHexByIdCache[txId]) {
    txHexByIdCache[txId] = await fetch(
      `${baseMempoolApiUrl}/tx/${txId}/hex`
    ).then((response) => response.text());
  }

  return txHexByIdCache[txId];
}

const toXOnly = (pubKey: string | any[]) =>
  pubKey.length === 32 ? pubKey : pubKey.slice(1, 33);

// Function to convert price from satoshi to Bitcoin
function convertSatToBtc(priceInSat: number): number {
  return priceInSat / 1e8; // 1 BTC = 100,000,000 SAT
}

// Function to convert price from satoshi to Bitcoin
function convertBtcToSat(priceInSat: number): number {
  return priceInSat * 1e8; // 1 BTC = 100,000,000 SAT
}

async function getUtxosByAddress(address: string) {
  return await mempoolBitcoin.addresses.getAddressTxsUtxo({ address });
}
const recommendedFeeRate = async (fee_rate?: FeeRateTier) =>
  fetch(`${baseMempoolApiUrl}/v1/fees/recommended`)
    .then((response) => response.json())
    .then((data) => data[fee_rate || feeLevel]);

async function doesUtxoContainInscription(utxo: { txid: any; vout: any }) {
  const html = await fetch(
    `${process.env.NEXT_PUBLIC_PROVIDER}/output/${utxo.txid}:${utxo.vout}`
  ).then((response) => response.text());

  return html.match(/class=thumbnails/) !== null;
}
async function mapUtxos(utxosFromMempool: AddressTxsUtxo[]): Promise<UTXO[]> {
  const ret: UTXO[] = [];
  for (const utxoFromMempool of utxosFromMempool) {
    const txHex = await getTxHexById(utxoFromMempool.txid);
    ret.push({
      txid: utxoFromMempool.txid,
      vout: utxoFromMempool.vout,
      value: utxoFromMempool.value,
      status: utxoFromMempool.status,
      tx: bitcoin.Transaction.fromHex(txHex),
    });
  }
  return ret;
}

function isP2SHAddress(address: string, network: bitcoin.Network): boolean {
  try {
    const { version, hash } = bitcoin.address.fromBase58Check(address);
    return version === network.scriptHash && hash.length === 20;
  } catch (error) {
    return false;
  }
}

function generateTxidFromHash(hash: Buffer) {
  return hash.reverse().toString("hex");
}

function calculateTxBytesFeeWithRate(
  vinsLength: number,
  voutsLength: number,
  feeRate: number,
  includeChangeOutput: 0 | 1 = 1
): number {
  const baseTxSize = 10;
  const inSize = 180;
  const outSize = 34;

  const txSize =
    baseTxSize +
    vinsLength * inSize +
    voutsLength * outSize +
    includeChangeOutput * outSize;
  const fee = txSize * feeRate;
  return fee;
}

async function calculateTxBytesFee(
  vinsLength: number,
  voutsLength: number,
  feeRateTier: string,
  includeChangeOutput: 0 | 1 = 1
) {
  const recommendedFR = await recommendedFeeRate(feeLevel);
  return calculateTxBytesFeeWithRate(
    vinsLength,
    voutsLength,
    recommendedFR,
    includeChangeOutput
  );
}

function getSellerOrdOutputValue(
  price: number,
  makerFeeBp: number | undefined,
  prevUtxoValue: number
): number {
  if (makerFeeBp === undefined || makerFeeBp === null) {
    console.log(
      "makerFeeBp was undefined or null, setting to default 100 basis points"
    );
    makerFeeBp = 100; // if makerFeeBp is undefined or null, set it to 100 basis points (1%)
  }
  console.log("makerFeeBp: ", makerFeeBp);

  const makerFeePercent = makerFeeBp / 10000; // converting basis points to percentage
  console.log("makerFeePercent: ", makerFeePercent);

  const makerFee = Math.floor(price * makerFeePercent);
  console.log("Maker's fee: ", makerFee);

  const outputValue = price - makerFee + prevUtxoValue;
  console.log("Output Value: ", outputValue);

  return outputValue;
}

export {
  fetchLatestInscriptionData,
  getTxHexById,
  validatePsbt,
  toXOnly,
  convertBtcToSat,
  convertSatToBtc,
  getUtxosByAddress,
  recommendedFeeRate,
  doesUtxoContainInscription,
  mapUtxos,
  isP2SHAddress,
  generateTxidFromHash,
  calculateTxBytesFee,
  calculateTxBytesFeeWithRate,
  getSellerOrdOutputValue,
  // other exports ...
};