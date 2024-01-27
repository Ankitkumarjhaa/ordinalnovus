import * as bitcoin from "bitcoinjs-lib";
import secp256k1 from "@bitcoinerlab/secp256k1";
import { AddressTxsUtxo, IListingState, UTXO } from "@/types";
import { IInscription } from "@/types";
import {
  calculateTxBytesFee,
  doesUtxoContainInscription,
  getUtxosByAddress,
  getSellerOrdOutputValue,
  getTxHexById,
  mapUtxos,
  toXOnly,
  calculateTxBytesFeeWithRate,
} from "@/utils/Marketplace";
import { convertSatToBtc } from "@/utils";
import { satsToDollars } from "@/utils/Inscribe";

export const DUMMY_UTXO_MIN_VALUE = Number(580);
export const DUMMY_UTXO_VALUE = 1000;
const ORDINALS_POSTAGE_VALUE = Number(1000);
export const PLATFORM_FEE_ADDRESS =
  process.env.PLATFORM_FEE_ADDRESS ||
  "bc1qz9fuxrcrta2ut0ad76zlse09e98x9wrr7su7u6";
const BUYING_PSBT_SELLER_SIGNATURE_INDEX = 2;

interface Result {
  status: string;
  message: string;
  data: any;
}
export async function buyOrdinalPSBT(
  payerAddress: string,
  receiverAddress: string,
  inscription: IInscription,
  price: number,
  publickey: string,
  wallet: string,
  fee_rate: number
): Promise<Result> {
  const numberOfDummyUtxosToCreate = 2;
  bitcoin.initEccLib(secp256k1);
  let payerUtxos: AddressTxsUtxo[];
  let dummyUtxos: UTXO[] | null;
  let paymentUtxos: AddressTxsUtxo[] | undefined;

  try {
    payerUtxos = await getUtxosByAddress(payerAddress);
  } catch (e) {
    console.error(e);
    return Promise.reject("Mempool error");
  }

  dummyUtxos = await selectDummyUTXOs(payerUtxos);
  let minimumValueRequired: number;
  let vins: number;
  let vouts: number;

  if (!dummyUtxos || dummyUtxos.length < 2) {
    console.log("Lacking dummy utxos");
    minimumValueRequired = numberOfDummyUtxosToCreate * DUMMY_UTXO_VALUE;
    vins = 0;
    vouts = numberOfDummyUtxosToCreate;
  } else {
    minimumValueRequired =
      price + numberOfDummyUtxosToCreate * DUMMY_UTXO_VALUE;
    vins = 1;
    vouts = 2 + numberOfDummyUtxosToCreate;
  }

  try {
    paymentUtxos = await selectPaymentUTXOs(
      payerUtxos,
      minimumValueRequired,
      vins,
      vouts,
      fee_rate
    );

    let psbt: any = null;

    if (
      dummyUtxos &&
      dummyUtxos.length >= 2 &&
      inscription.address &&
      inscription.listed_price &&
      inscription.listed_seller_receive_address &&
      inscription.output_value
    ) {
      const listing = {
        seller: {
          makerFeeBp: 100,
          sellerOrdAddress: inscription.address,
          price: inscription.listed_price,
          ordItem: inscription,
          sellerReceiveAddress: inscription.listed_seller_receive_address,
          signedListingPSBTBase64: inscription.signed_psbt,
          tapInternalKey: inscription.tap_internal_key,
        },
        buyer: {
          takerFeeBp: 0,
          buyerAddress: payerAddress,
          buyerTokenReceiveAddress: receiverAddress,
          fee_rate,
          buyerPublicKey: publickey,
          unsignedBuyingPSBTBase64: "",
          buyerDummyUTXOs: dummyUtxos,
          buyerPaymentUTXOs: paymentUtxos,
        },
      };
      console.log("Generating payment PSBT");
      console.log({ listing });

      psbt = await generateUnsignedBuyingPSBTBase64(listing, wallet);
      return {
        status: "success",
        message: "has valid utxo",
        data: {
          paymentUtxos,
          payerAddress,
          psbt,
          for: "buy",
        },
      };
    } else {
      if (paymentUtxos)
        psbt = await generateUnsignedCreateDummyUtxoPSBTBase64(
          payerAddress,
          publickey,
          paymentUtxos,
          fee_rate,
          wallet
        );
      console.log(psbt, "PSBT CREATED");
      return {
        status: "success",
        message: "doesnt have dummy UTXO",
        data: {
          paymentUtxos,
          payerAddress,
          numberOfDummyUtxosToCreate,
          dummyUtxos,
          psbt,
          for: "dummy",
        },
      };
    }
  } catch (e) {
    paymentUtxos = undefined;
    // console.error(e);
    return Promise.reject(e);
  }
}

async function generateUnsignedCreateDummyUtxoPSBTBase64(
  address: string,
  buyerPublicKey: string | undefined,
  unqualifiedUtxos: AddressTxsUtxo[],
  fee_rate: number,
  wallet: string
): Promise<string> {
  wallet = wallet?.toLowerCase();

  const psbt = new bitcoin.Psbt({ network: undefined });
  const [mappedUnqualifiedUtxos, recommendedFee] = await Promise.all([
    mapUtxos(unqualifiedUtxos),
    fee_rate,
  ]);

  // Loop the unqualified utxos until we have enough to create a dummy utxo
  let totalValue = 0;
  let paymentUtxoCount = 0;

  const taprootAddress = address.startsWith("bc1p");
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
        pubkey: Buffer.from(buyerPublicKey!, "hex"),
      }).output;
      const p2sh = bitcoin.payments.p2sh({
        redeem: { output: redeemScript },
      });

      if (wallet !== "unisat") {
        input.witnessUtxo = tx.outs[utxo.vout];
        // input.witnessUtxo = {
        //   script: p2sh.output,
        //   value: dummyUtxo.value,
        // } as WitnessUtxo;
        if (wallet === "xverse") input.redeemScript = p2sh.redeem?.output;
      } else {
        // unisat wallet should not have redeemscript for buy tx
        input.witnessUtxo = tx.outs[utxo.vout];
      }
    } else {
      // unisat
      input.witnessUtxo = utxo.tx.outs[utxo.vout];
      input.tapInternalKey = toXOnly(
        utxo.tx.toBuffer().constructor(buyerPublicKey, "hex")
      );
    }

    psbt.addInput(input);
    totalValue += utxo.value;
    paymentUtxoCount += 1;

    const fees = calculateTxBytesFeeWithRate(
      paymentUtxoCount,
      2, // 2-dummy outputs
      recommendedFee
    );
    if (totalValue >= DUMMY_UTXO_VALUE * 2 + fees) {
      break;
    }
  }

  const finalFees = calculateTxBytesFeeWithRate(
    paymentUtxoCount,
    2, // 2-dummy outputs
    recommendedFee
  );

  console.log({ totalValue, finalFees });
  const changeValue =
    totalValue -
    DUMMY_UTXO_VALUE * 2 -
    Math.floor(fee_rate < 150 ? finalFees / 1.5 : finalFees / 1.3);
  console.log({ changeValue });

  // We must have enough value to create a dummy utxo and pay for tx fees
  if (changeValue < 0) {
    throw new Error(
      `You might have pending transactions or not enough fund to complete tx at the provided FeeRate`
    );
  }

  psbt.addOutput({
    address,
    value: DUMMY_UTXO_VALUE,
  });
  psbt.addOutput({
    address,
    value: DUMMY_UTXO_VALUE,
  });

  // to avoid dust
  if (changeValue > DUMMY_UTXO_MIN_VALUE) {
    psbt.addOutput({
      address,
      value: changeValue,
    });
  }

  console.log("psbt made");

  return psbt.toBase64();
}

async function selectDummyUTXOs(
  utxos: AddressTxsUtxo[]
): Promise<UTXO[] | null> {
  const result: UTXO[] = [];
  let counter = 0;

  for (const utxo of utxos) {
    if (await doesUtxoContainInscription(utxo)) {
      continue;
    }

    if (utxo.value >= 580 && utxo.value <= 1000) {
      const mappedUtxo = await mapUtxos([utxo]);
      result.push(mappedUtxo[0]);
      counter++;

      if (counter === 2) {
        break;
      }
    }
  }

  return result;
}

export async function selectPaymentUTXOs(
  utxos: AddressTxsUtxo[],
  amount: number, // amount is expected total output (except tx fee)
  vinsLength: number,
  voutsLength: number,
  fee_rate: number
) {
  const selectedUtxos: any = [];
  let selectedAmount = 0;

  // Sort descending by value, and filter out dummy utxos
  utxos = utxos
    .filter((x) => x.value > DUMMY_UTXO_VALUE)
    .sort((a, b) => b.value - a.value);

  for (const utxo of utxos) {
    // Never spend a utxo that contains an inscription for cardinal purposes
    if (await doesUtxoContainInscription(utxo)) {
      continue;
    }
    selectedUtxos.push(utxo);
    selectedAmount += utxo.value;

    if (
      selectedAmount >=
      amount +
        (await calculateTxBytesFee(
          vinsLength + selectedUtxos.length,
          voutsLength,
          fee_rate
        ))
    ) {
      break;
    }
  }

  if (selectedAmount < amount) {
    throw `Your wallet needs ${Number(
      await satsToDollars(amount - selectedAmount)
    ).toFixed(2)} USD more`;
    throw new Error(`Not enough cardinal spendable funds. \n
Address has:  ${await satsToDollars(selectedAmount)} USD \n
Needed:       ${await satsToDollars(amount)} USD`);
  }

  return selectedUtxos;
}
async function generateUnsignedBuyingPSBTBase64(
  listing: IListingState,
  wallet: string
) {
  wallet = wallet.toLowerCase();
  const psbt = new bitcoin.Psbt({ network: undefined });

  const collection = listing.seller.ordItem.official_collection;

  const taprootAddress = listing?.buyer?.buyerAddress.startsWith("bc1p");
  const buyerPublicKey = listing?.buyer?.buyerPublicKey;
  if (
    !listing.buyer ||
    !listing.buyer.buyerAddress ||
    !listing.buyer.buyerTokenReceiveAddress
  ) {
    throw new Error("Buyer address is not set");
  }
  if (!listing.seller.ordItem.output_value) {
    throw Error("Inscription has no output value");
  }

  if (
    listing.buyer.buyerDummyUTXOs?.length !== 2 ||
    !listing.buyer.buyerPaymentUTXOs
  ) {
    throw new Error("Buyer address has not enough utxos");
  }

  let totalInput = 0;

  // Add two dummyUtxos
  for (const dummyUtxo of listing.buyer.buyerDummyUTXOs) {
    const tx = bitcoin.Transaction.fromHex(await getTxHexById(dummyUtxo.txid));
    for (const output in tx.outs) {
      try {
        tx.setWitness(parseInt(output), []);
      } catch {}
    }
    const input: any = {
      hash: dummyUtxo.txid,
      index: dummyUtxo.vout,
      ...(taprootAddress && {
        nonWitnessUtxo: tx.toBuffer(),
      }),
    };

    if (!taprootAddress) {
      const redeemScript = bitcoin.payments.p2wpkh({
        pubkey: Buffer.from(buyerPublicKey!, "hex"),
      }).output;
      const p2sh = bitcoin.payments.p2sh({
        redeem: { output: redeemScript },
      });

      if (wallet !== "unisat") {
        input.witnessUtxo = tx.outs[dummyUtxo.vout];
        // input.witnessUtxo = {
        //   script: p2sh.output,
        //   value: dummyUtxo.value,
        // } as WitnessUtxo;
        if (wallet === "xverse") input.redeemScript = p2sh.redeem?.output;
      } else {
        // unisat wallet should not have redeemscript for buy tx
        input.witnessUtxo = tx.outs[dummyUtxo.vout];
      }
    } else {
      // unisat
      input.witnessUtxo = tx.outs[dummyUtxo.vout];
      input.tapInternalKey = toXOnly(
        tx.toBuffer().constructor(buyerPublicKey, "hex")
      );
    }

    psbt.addInput(input);
    totalInput += dummyUtxo.value;
  }

  // Add dummy output
  psbt.addOutput({
    address: listing.buyer.buyerAddress,
    value:
      listing.buyer.buyerDummyUTXOs[0].value +
      listing.buyer.buyerDummyUTXOs[1].value,
    //+
    // listing.seller.ordItem.output_value,
  });
  // Add ordinal output
  psbt.addOutput({
    address: listing.buyer.buyerTokenReceiveAddress,
    value: ORDINALS_POSTAGE_VALUE,
  });

  const { sellerInput, sellerOutput } = await getSellerInputAndOutput(listing);

  psbt.addInput(sellerInput);
  psbt.addOutput(sellerOutput);

  // Add payment utxo inputs
  for (const utxo of listing.buyer.buyerPaymentUTXOs) {
    const tx = bitcoin.Transaction.fromHex(await getTxHexById(utxo.txid));
    for (const output in tx.outs) {
      try {
        tx.setWitness(parseInt(output), []);
      } catch {}
    }

    const input: any = {
      hash: utxo.txid,
      index: utxo.vout,
      ...(taprootAddress && {
        nonWitnessUtxo: tx.toBuffer(),
      }),
    };

    if (!taprootAddress) {
      const redeemScript = bitcoin.payments.p2wpkh({
        pubkey: Buffer.from(listing.buyer.buyerPublicKey!, "hex"),
      }).output;
      const p2sh = bitcoin.payments.p2sh({
        redeem: { output: redeemScript },
      });

      if (wallet !== "unisat") {
        input.witnessUtxo = tx.outs[utxo.vout];
        // input.witnessUtxo = {
        //   script: p2sh.output,
        //   value: utxo.value,
        // } as WitnessUtxo;
        if (wallet === "xverse") input.redeemScript = p2sh.redeem?.output;
      } else {
        // unisat wallet should not have redeemscript for buy tx
        input.witnessUtxo = tx.outs[utxo.vout];
      }
    } else {
      input.witnessUtxo = tx.outs[utxo.vout];
      input.tapInternalKey = toXOnly(
        tx.toBuffer().constructor(listing.buyer.buyerPublicKey, "hex")
      );
    }

    psbt.addInput(input);

    totalInput += utxo.value;
  }

  // Create a platform fee output
  let platformFeeValue = Math.floor((listing.seller.price * (0 + 100)) / 10000);
  // Assuming listing.seller.price is in satoshis
  platformFeeValue = Math.max(Math.round(listing.seller.price * 0.01), 4000);

  // platformFeeValue > DUMMY_UTXO_MIN_VALUE ? platformFeeValue : 580;

  console.log(platformFeeValue, "PLATFORM_FEE");
  if (platformFeeValue > 0) {
    psbt.addOutput({
      address: PLATFORM_FEE_ADDRESS,
      value: platformFeeValue,
    });
  }

  if (collection && collection?.royalty_address && collection?.royalty_bp) {
    const bp = collection.royalty_bp; // 300 represents 3% (since 100 basis points = 1%)

    // Calculate the royalty value based on the basis points
    let royaltyValue = Math.round((listing.seller.price * bp) / 10000);

    // Ensure the minimum royalty value is 2000 if the calculated value is less
    royaltyValue = Math.max(royaltyValue, 2000);

    console.log(royaltyValue, "ROYALTY_FEE");

    if (royaltyValue > 0) {
      psbt.addOutput({
        address: collection.royalty_address,
        value: royaltyValue,
      });
    }
  }

  // Create two new dummy utxo output for the next purchase
  psbt.addOutput({
    address: listing.buyer.buyerAddress,
    value: DUMMY_UTXO_VALUE,
  });
  psbt.addOutput({
    address: listing.buyer.buyerAddress,
    value: DUMMY_UTXO_VALUE,
  });

  const fee = await calculateTxBytesFee(
    psbt.txInputs.length,
    psbt.txOutputs.length, // already taken care of the exchange output bytes calculation
    listing.buyer.fee_rate
    // 0
  );

  const totalOutput = psbt.txOutputs.reduce(
    (partialSum, a) => partialSum + a.value,
    0
  );

  const changeValue =
    totalInput -
    totalOutput -
    Math.floor(listing.buyer.fee_rate < 150 ? fee / 1.5 : fee / 1.5);

  if (changeValue < 0) {
    throw `Your wallet needs ${Number(
      await satsToDollars(-changeValue)
    ).toFixed(2)} USD more`;
    throw `Your wallet address doesn't have enough funds to buy this inscription.
Price:      ${convertSatToBtc(listing.seller.price)} BTC
Required:   ${convertSatToBtc(totalOutput + fee)} BTC
Missing:    ${convertSatToBtc(-changeValue)} BTC`;
  }

  // Change utxo
  if (changeValue > DUMMY_UTXO_MIN_VALUE) {
    psbt.addOutput({
      address: listing.buyer.buyerAddress,
      value: changeValue + listing.seller.ordItem.output_value,
    });
  }

  console.log({ totalInput, totalOutput, fee, changeValue });
  // console.dir(psbt, { depth: null });

  listing.buyer.unsignedBuyingPSBTBase64 = psbt.toBase64();
  listing.buyer.unsignedBuyingPSBTInputSize = psbt.data.inputs.length;
  return listing;
}

async function getSellerInputAndOutput(listing: IListingState) {
  if (!listing.seller.ordItem.output) {
    throw Error("Inscription has no output");
  }
  const [ordinalUtxoTxId, ordinalUtxoVout] =
    listing.seller.ordItem.output.split(":");
  const tx = bitcoin.Transaction.fromHex(await getTxHexById(ordinalUtxoTxId));
  // No need to add this witness if the seller is using taproot
  if (!listing.seller.tapInternalKey) {
    for (let outputIndex = 0; outputIndex < tx.outs.length; outputIndex++) {
      try {
        tx.setWitness(outputIndex, []);
      } catch {}
    }
  }

  const sellerInput: any = {
    hash: ordinalUtxoTxId,
    index: parseInt(ordinalUtxoVout),
    nonWitnessUtxo: tx.toBuffer(),
    // No problem in always adding a witnessUtxo here
    witnessUtxo: tx.outs[parseInt(ordinalUtxoVout)],
  };
  // If taproot is used, we need to add the internal key
  if (listing.seller.tapInternalKey) {
    sellerInput.tapInternalKey = toXOnly(
      tx.toBuffer().constructor(listing.seller.tapInternalKey, "hex")
    );
    console.log(sellerInput.tapInternalKey.toString("hex"), "tik");
  }
  if (!listing.seller.ordItem.output_value) {
    throw Error("Inscription has no output value");
  }

  const ret = {
    sellerInput,
    sellerOutput: {
      address: listing.seller.sellerReceiveAddress,
      value: getSellerOrdOutputValue(
        listing.seller.price,
        listing.seller.makerFeeBp,
        listing.seller.ordItem.output_value
      ),
    },
  };

  return ret;
}

export function mergeSignedBuyingPSBTBase64(
  signedListingPSBTBase64: string,
  signedBuyingPSBTBase64: string
): string {
  console.log("[INFO] Initiating merging of signed PSBTs.");

  // Deserialize PSBTs from Base64
  console.log("[INFO] Deserializing seller PSBTs from Base64.");
  const sellerSignedPsbt = bitcoin.Psbt.fromBase64(signedListingPSBTBase64);

  console.log("[INFO] Deserializing buyer PSBTs from Base64.");
  const buyerSignedPsbt = bitcoin.Psbt.fromBase64(signedBuyingPSBTBase64);

  // Merge operations
  console.log("[INFO] Merging seller's signature into buyer's PSBT.");

  (buyerSignedPsbt.data.globalMap.unsignedTx as any).tx.ins[
    BUYING_PSBT_SELLER_SIGNATURE_INDEX
  ] = (sellerSignedPsbt.data.globalMap.unsignedTx as any).tx.ins[0];

  buyerSignedPsbt.data.inputs[BUYING_PSBT_SELLER_SIGNATURE_INDEX] =
    sellerSignedPsbt.data.inputs[0];

  console.log("[SUCCESS] Merging completed successfully.");

  // Return serialized PSBT
  console.log("[INFO] Serializing merged PSBT to Base64.");
  return buyerSignedPsbt.toBase64();
}
