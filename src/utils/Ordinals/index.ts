// // Import necessary libraries
// import * as bitcoin from "bitcoinjs-lib";
// import secp256k1 from "@bitcoinerlab/secp256k1";
// import axios from 'axios'
// import { Transaction, UTXO } from "@/types";
// const dummyUtxoValue = 1000; // Replace with the actual value
// let sellerSignedPsbt;
// bitcoin.initEccLib(secp256k1);
// const varuint = require("bip174/src/lib/converter/varint");

// export const baseMempoolUrl = true
//   ? "https://mempool.space"
//   : "https://mempool.space/signet";
// export const baseMempoolApiUrl = `${baseMempoolUrl}/api`;
// const ordinalsExplorerUrl = process.env.NEXT_PUBLIC_PROVIDER;
// let price = 0;
// const feeLevel = "halfHourFee";

// /**
//  * Formats number as currency string.
//  *
//  * @param number Number to format.
//  */
// const numberToCurrencyString = (number: number) =>
//   number.toLocaleString("en-US");

// export const toXOnly = (pubKey: string | any[]) =>
//   pubKey.length === 32 ? pubKey : pubKey.slice(1, 33);

//   export async function fetchInscriptionAddress(inscriptionId: string) {
//   try {
//     const response = await axios.get(
//       `${process.env.NEXT_PUBLIC_PROVIDER}/api/inscription/${inscriptionId}`
//     );
//     return response.data.address;
//   } catch (error:any) {
//     throw new Error(`Error fetching inscription data: ${error.message}`);
//   }
// }
// export async function doesUtxoContainInscription(utxo: { txid: any; vout: any }) {
//   const html = await fetch(
//     `${ordinalsExplorerUrl}/output/${utxo.txid}:${utxo.vout}`
//   ).then((response) => response.text());

//   return html.match(/class=thumbnails/) !== null;
// }
// function extractInscriptionId(html: string): string | null {
//   const regex = /\/inscription\/([0-9A-Fa-f]{64}i\d+)/;
//   const match = html.match(regex);
//   return match ? match[1] : null;
// }

// export async function inscriptionInThisUtxo(utxo: { txid: any; vout: any }) {
//   const url = `${ordinalsExplorerUrl}/output/${utxo.txid}:${utxo.vout}`;
//   console.log(url);
//   const html = await fetch(url).then((response) => response.text());
//   const inscriptionId = extractInscriptionId(html);

//   if (inscriptionId) {
//     const url2 = `${process.env.NEXT_PUBLIC_API}/inscription?inscriptionId=${inscriptionId}&apiKey=${process.env.API_KEY}`;

//     console.log(inscriptionId, "ID", url2, "URL2");
//     const response = await fetch(url2);
//     const data = await response.json();
//     return data.inscriptions[0];
//   } else {
//     console.error("Inscription ID not found");
//     return null
//   }

//   return null;
// }

// export async function getAddressMempoolTxIds(address: any) {
//   return await fetch(`${baseMempoolApiUrl}/address/${address}/txs/mempool`)
//     .then((response) => response.json())
//     .then((txs) => txs.map((tx: { txid: any }) => tx.txid));
// }
// export async function getAddressUtxos(address: any) {
//   return await fetch(`${baseMempoolApiUrl}/address/${address}/utxo`).then(
//     (response) => response.json()
//   );
// }

// export async function selectUtxos(
//   utxos: UTXO[],
//   amount: number,
//   vins: number,
//   vouts: number,
//   recommendedFeeRate: number
// ): Promise<UTXO[]> {
//   const selectedUtxos: UTXO[] = [];
//   let selectedAmount = 0;

//   // Sort descending by value, and filter out dummy utxos
//   utxos = utxos
//     .filter((x) => x.value > dummyUtxoValue * 2)
//     .sort((a, b) => b.value - a.value);

//   for (const utxo of utxos) {
//     // Never spend a utxo that contains an inscription for cardinal purposes
//     if (await doesUtxoContainInscription(utxo)) {
//       continue;
//     }
//     selectedUtxos.push(utxo);
//     selectedAmount += utxo.value;

//     if (
//       selectedAmount >=
//       amount +
//         dummyUtxoValue +
//         dummyUtxoValue +
//         calculateFee(vins + selectedUtxos.length, vouts, recommendedFeeRate)
//     ) {
//       break;
//     }
//   }

//   if (selectedAmount < amount) {
//     throw new Error(`Not enough cardinal spendable funds.
// Address has:  ${satToBtc(selectedAmount)} BTC
// Needed:    ${satToBtc(amount)} BTC`)
//   }

//   return selectedUtxos;
// }

// export async function selectPaddingUtxos(
//   utxos: any[],
//   amount: number,
//   vins: number,
//   vouts: any,
//   recommendedFeeRate: any,
//   payerAddress: any
// ) {
//   const selectedUtxos = [];
//   let selectedAmount = 0;

//   // Sort descending by value
//   utxos = utxos.sort((a, b) => b.value - a.value);

//   for (const utxo of utxos) {
//     // Never spend a utxo that contains an inscription for cardinal purposes
//     if (await doesUtxoContainInscription(utxo)) {
//       continue;
//     }

//     if (utxo.value > 1000) {
//       selectedAmount += utxo.value;
//       selectedUtxos.push(utxo);
//     }

//     if (
//       selectedAmount >=
//       amount +
//         calculateFee(vins + selectedUtxos.length, vouts, recommendedFeeRate)
//     ) {
//       break;
//     }
//   }

//   console.log(selectedAmount, amount, "compare");
//   if (selectedAmount < amount) {
//     //     throw new Error(`Not enough cardinal spendable funds.
//     // Address has:  ${satToBtc(selectedAmount)} BTC
//     // Needed:  ${satToBtc(amount)} BTC`);

//     return {
//       status: "error",
//       message: `Address has ${satToBtc(selectedAmount)} BTC Needs ${satToBtc(
//         amount
//       )} BTC`,
//     };
//   }

//   return selectedUtxos;
//   async function doesUtxoContainInscription(utxo: { txid: any; vout: any }) {
//     const html = await fetch(
//       `${ordinalsExplorerUrl}/output/${utxo.txid}:${utxo.vout}`
//     ).then((response) => response.text());

//     return html.match(/class=thumbnails/) !== null;
//   }
// }

// export function removeFalsey(arr: any[]) {
//   // newly created array
//   let newArr: any[] = [];

//   // Iterate the array using the forEach loop
//   arr.forEach((k) => {
//     // check for the truthy value
//     if (k) {
//       newArr.push(k);
//     }
//   });
//   // return the new array
//   return newArr;
// }

// function estimateTxSize(vins: number, vouts: number, address?: string): number {
//   const baseTxSize = 10;
//   let inSize;

//   if (address) {
//     if (address.startsWith("bc1")) {
//       // SegWit transaction
//       if (address.startsWith("bc1p")) {
//         // P2WPKH (Pay-to-Witness-Public-Key-Hash)
//         inSize = 68;
//       } else {
//         // P2WSH (Pay-to-Witness-Script-Hash)
//         inSize = 108;
//       }
//     } else if (address.startsWith("3")) {
//       // P2SH (Pay-to-Script-Hash) transaction
//       inSize = 295;
//     } else {
//       // Default to P2PKH (Pay-to-Public-Key-Hash) transaction
//       inSize = 148;
//     }
//   } else {
//     // Default to P2WPKH (Pay-to-Witness-Public-Key-Hash) transaction
//     inSize = 68;
//   }

//   const outSize = 34;
//   console.log({ baseTxSize, vins, inSize, vouts, outSize });
//   const txSize = baseTxSize + vins * inSize + vouts * outSize;

//   return txSize;
// }

// export function calculateFee(
//   vins: number,
//   vouts: number,
//   recommendedFeeRate: number,
//   address?: string,
//   includeChangeOutput = true
// ): number {
//   const txSize = estimateTxSize(
//     vins,
//     vouts + (includeChangeOutput ? 1 : 0),
//     address
//   );

//   console.log(txSize, "Estimated txSize inside CalculateFee", recommendedFeeRate,"recommended fee rate");

//   const fee = (txSize ) * recommendedFeeRate;

//   return fee;
// }

// export function calculateTxSize(psbt: {
//   data: {
//     globalMap: {
//       unsignedTx: { toBuffer: () => { (): any; new (): any; length: any } };
//     };
//   };
// }) {
//   return psbt.data.globalMap.unsignedTx.toBuffer().length;
// }

// export function btcToSat(btc: any) {
//   return Math.floor(Number(btc) * Math.pow(10, 8));
// }

// export function satToBtc(sat: number) {
//   return Number(sat) / Math.pow(10, 8);
// }

// type TxId = string | number;
// const txHexByIdCache: Record<TxId, string> = {};

// export async function getTxHexById(txId: TxId): Promise<string> {
//   if (!txHexByIdCache[txId]) {
//     txHexByIdCache[txId] = await fetch(
//       `${baseMempoolApiUrl}/tx/${txId}/hex`
//     ).then((response) => response.text());
//   }

//   return txHexByIdCache[txId];
// }

// export const recommendedFeeRate = async () =>
//   fetch(`${baseMempoolApiUrl}/v1/fees/recommended`)
//     .then((response) => response.json())
//     .then((data) => data[feeLevel]);

// export async function getInscriptionDataById(
//   inscriptionId: string,
//   verifyIsInscriptionNumber?: any
// ) {
//   const html = await fetch(
//     ordinalsExplorerUrl + "/inscription/" + inscriptionId
//   ).then((response) => response.text());

//   //@ts-ignore
//   const data: any = [...html.matchAll(/<dt>(.*?)<\/dt>\s*<dd.*?>(.*?)<\/dd>/gm)]
//     .map((x) => {
//       x[2] = x[2].replace(/<.*?>/gm, "");
//       return x;
//     })
//     .reduce((a, b) => {
//       return { ...a, [b[1]]: b[2] };
//     }, {});

//   const error = `Inscription ${
//     verifyIsInscriptionNumber || inscriptionId
//   } not found (maybe you're on signet and looking for a mainnet inscription or vice versa)`;
//   try {
//     //@ts-ignore
//     data.number = html.match(/<h1>Inscription (\d*)<\/h1>/)[1];
//   } catch {
//     throw new Error(error);
//   }
//   if (
//     verifyIsInscriptionNumber &&
//     String(data.number) != String(verifyIsInscriptionNumber)
//   ) {
//     throw new Error(error);
//   }

//   return data;
// }

// export function validateSellerPSBTAndExtractPrice(
//   sellerSignedPsbtBase64: string,
//   utxo: string
// ) {
//   try {
//     sellerSignedPsbtBase64 = sellerSignedPsbtBase64.trim().replaceAll(" ", "+");
//     sellerSignedPsbt = bitcoin.Psbt.fromBase64(sellerSignedPsbtBase64, {
//       network: undefined,
//     });
//     const sellerInput = sellerSignedPsbt.txInputs[0];
//     const sellerSignedPsbtInput = `${sellerInput.hash
//       .reverse()
//       .toString("hex")}:${sellerInput.index}`;

//     if (sellerSignedPsbtInput != utxo) {
//       // console.error(
//       //   `Seller signed PSBT does not match this inscription\n\n${sellerSignedPsbtInput}\n!=\n${utxo}`
//       // );
//       return {
//         error: `Seller signed PSBT does not match this inscription ${sellerSignedPsbtInput} != ${utxo}`,
//       };
//     }
//     if (
//       sellerSignedPsbt.txInputs.length != 1 ||
//       sellerSignedPsbt.txInputs.length != 1
//     ) {
//       return { error: "`Invalid seller signed PSBT`" };
//     }

//     try {
//       sellerSignedPsbt.extractTransaction(true);
//     } catch (e: any) {
//       if (e.message == "Not finalized") {
//         return { error: "PSBT not signed" };
//       } else if (e.message != "Outputs are spending more than Inputs") {
//         return { error: "Invalid PSBT " + e.message || e };
//       }
//     }

//     const sellerOutput = sellerSignedPsbt.txOutputs[0];
//     price = sellerOutput.value;

//     return Number(price);
//   } catch (e) {
//     console.error(e, "error in validateSellerPSBTAndExtractPrice");
//   }
// }

// export const nostrRelayUrl = "wss://nostr.openordex.org";
// export const nostrOrderEventKind = 802;

// export const addressHasTxInMempool = async (
//   address: string
// ): Promise<string[]|false> => {
//   const payerCurrentMempoolTxIds = await getAddressMempoolTxIds(address);
//   if (payerCurrentMempoolTxIds.length > 1) return payerCurrentMempoolTxIds;
//   else return false;
// };

// export async function getTxFromMempool(txid: string): Promise<Transaction> {
//   return await fetch(`${baseMempoolApiUrl}/tx/${txid}`).then((response) =>
//     response.json()
//   );
// }

// export const fetcher = <T = any>(
//   ...args: Parameters<typeof fetch>
// ): Promise<T> => fetch(...args).then((res) => res.json() as Promise<T>);

// export const convert = (n: number) => {
//   if (n < 1e3) return n;
//   if (n >= 1e3 && n < 1e6) return +(n / 1e3).toFixed(1) + "K";
//   if (n >= 1e6 && n < 1e9) return +(n / 1e6).toFixed(1) + "M";
//   if (n >= 1e9 && n < 1e12) return +(n / 1e9).toFixed(1) + "B";
//   if (n >= 1e12) return +(n / 1e12).toFixed(1) + "T";
// };

// export function base64ToHex(str: string) {
//   return atob(str)
//     .split("")
//     .map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
//     .join("");
// }

// export const range = (n: any) => Array.from(Array(n).keys());

// export function satsToFormattedDollarString(
//   sats: number,
//   _bitcoinPrice: number
// ) {
//   return (satToBtc(sats) * _bitcoinPrice).toLocaleString(undefined, {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   });
// }

// // Replace notify with console.log
// export function notify(notification: { type: string; message: string }) {
//   console.log(notification.type.toUpperCase() + ": " + notification.message);
// }
