import * as bitcoin from "bitcoinjs-lib";
import secp256k1 from "@bitcoinerlab/secp256k1";
import {
  AddressTxsUtxo,
  IInscription,
  IListingState,
  UTXO,
  WitnessUtxo,
} from "@/types/Ordinals";
import {
  calculateTxBytesFee,
  convertSatToBtc,
  doesUtxoContainInscription,
  getUtxosByAddress,
  getSellerOrdOutputValue,
  getTxHexById,
  isP2SHAddress,
  mapUtxos,
  recommendedFeeRate,
  toXOnly,
  calculateTxBytesFeeWithRate,
} from "@/utils/Marketplace";

const DUMMY_UTXO_MAX_VALUE = Number(1000);
const DUMMY_UTXO_MIN_VALUE = Number(580);
const DUMMY_UTXO_VALUE = 1000;
const ORDINALS_POSTAGE_VALUE = Number(10000);
const PLATFORM_FEE_ADDRESS =
  process.env.PLATFORM_FEE_ADDRESS ||
  "bc1pfappe7h7l6hpzvj2mdgqehaalygxr449tf0asv8s7wxrfdr0gc6quf9pnd";
const BUYING_PSBT_SELLER_SIGNATURE_INDEX = 2;

bitcoin.initEccLib(secp256k1);
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
  numberOfDummyUtxosToCreate: number = 2,
  DUMMY_UTXO_VALUE: number = 1000
): Promise<Result> {
  let payerUtxos: AddressTxsUtxo[];
  let dummyUtxos: UTXO[] | null;
  let paymentUtxos: AddressTxsUtxo[] | undefined;

  try {
    payerUtxos = await getUtxosByAddress(payerAddress);
  } catch (e) {
    console.error(e);
    return Promise.reject(e);
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
      ""
    );

    let psbt = null;

    if (
      dummyUtxos &&
      dummyUtxos.length >= 2 &&
      inscription.address &&
      inscription.listedPrice &&
      inscription.listedSellerReceiveAddress &&
      inscription.output_value
    ) {
      const listing = {
        seller: {
          makerFeeBp: inscription.listedMakerFeeBp || 0,
          sellerOrdAddress: inscription.address,
          price: inscription.listedPrice,
          ordItem: inscription,
          sellerReceiveAddress: inscription.listedSellerReceiveAddress,
          unsignedListingPSBTBase64: inscription.unSignedPsbt,
          signedListingPSBTBase64: inscription.signedPsbt,
          tapInternalKey: inscription.tapInternalKey,
        },
        buyer: {
          takerFeeBp: 0,
          buyerAddress: payerAddress,
          buyerTokenReceiveAddress: receiverAddress,
          feeRateTier: "",
          buyerPublicKey: publickey,
          unsignedBuyingPSBTBase64: "",
          buyerDummyUTXOs: dummyUtxos,
          buyerPaymentUTXOs: paymentUtxos,
        },
      };
      console.log("Generating payment PSBT");

      psbt = await generateUnsignedBuyingPSBTBase64(listing);
      return {
        status: "success",
        message: "has valid utxo",
        data: {
          paymentUtxos,
          payerAddress,
          psbt,
          for: "buying",
        },
      };
    } else {
      psbt = await generateUnsignedCreateDummyUtxoPSBTBase64(
        payerAddress,
        publickey,
        paymentUtxos,
        "",
        inscription
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
  feeRateTier: string,
  itemProvider: IInscription
): Promise<string> {
  const psbt = new bitcoin.Psbt({ network: undefined });
  const [mappedUnqualifiedUtxos, recommendedFee] = await Promise.all([
    mapUtxos(unqualifiedUtxos),
    recommendedFeeRate("halfHourFee"),
  ]);

  // Loop the unqualified utxos until we have enough to create a dummy utxo
  let totalValue = 0;
  let paymentUtxoCount = 0;
  for (const utxo of mappedUnqualifiedUtxos) {
    if (await doesUtxoContainInscription(utxo)) {
      continue;
    }

    const input: any = {
      hash: utxo.txid,
      index: utxo.vout,
      nonWitnessUtxo: utxo.tx.toBuffer(),
    };

    if (isP2SHAddress(address, bitcoin.networks.bitcoin)) {
      const redeemScript = bitcoin.payments.p2wpkh({
        pubkey: Buffer.from(buyerPublicKey!, "hex"),
      }).output;
      const p2sh = bitcoin.payments.p2sh({
        redeem: { output: redeemScript },
      });
      input.witnessUtxo = utxo.tx.outs[utxo.vout];
      input.redeemScript = p2sh.redeem?.output;
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

  const changeValue = totalValue - DUMMY_UTXO_VALUE * 2 - finalFees;

  // We must have enough value to create a dummy utxo and pay for tx fees
  if (changeValue < 0) {
    throw new Error(`You might have pending transactions or not enough fund`);
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

  return psbt.toBase64();
}
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

//   console.log(
//     txSize,
//     "Estimated txSize inside CalculateFee",
//     recommendedFeeRate,
//     "recommended fee rate"
//   );

//   const fee = txSize * recommendedFeeRate;

//   return fee;
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

async function selectPaymentUTXOs(
  utxos: AddressTxsUtxo[],
  amount: number, // amount is expected total output (except tx fee)
  vinsLength: number,
  voutsLength: number,
  feeRateTier: string
) {
  const selectedUtxos = [];
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
          feeRateTier
        ))
    ) {
      break;
    }
  }

  if (selectedAmount < amount) {
    throw new Error(`Not enough cardinal spendable funds.
Address has:  ${convertSatToBtc(selectedAmount)} BTC
Needed:       ${convertSatToBtc(amount)} BTC`);
  }

  return selectedUtxos;
}
async function generateUnsignedBuyingPSBTBase64(listing: IListingState) {
  const psbt = new bitcoin.Psbt({ network: undefined });
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
    const input: any = {
      hash: dummyUtxo.txid,
      index: dummyUtxo.vout,
      nonWitnessUtxo: dummyUtxo.tx.toBuffer(),
    };

    const p2shInputRedeemScript: any = {};
    const p2shInputWitnessUTXO: any = {};

    if (isP2SHAddress(listing.buyer.buyerAddress, bitcoin.networks.bitcoin)) {
      const redeemScript = bitcoin.payments.p2wpkh({
        pubkey: Buffer.from(listing.buyer.buyerPublicKey!, "hex"),
      }).output;
      const p2sh = bitcoin.payments.p2sh({
        redeem: { output: redeemScript },
      });
      p2shInputWitnessUTXO.witnessUtxo = {
        script: p2sh.output,
        value: dummyUtxo.value,
      } as WitnessUtxo;
      p2shInputRedeemScript.redeemScript = p2sh.redeem?.output;
    }

    psbt.addInput({
      ...input,
      ...p2shInputWitnessUTXO,
      ...p2shInputRedeemScript,
    });
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
    const input: any = {
      hash: utxo.txid,
      index: utxo.vout,
      nonWitnessUtxo: tx.toBuffer(),
    };

    const p2shInputWitnessUTXOUn: any = {};
    const p2shInputRedeemScriptUn: any = {};

    if (isP2SHAddress(listing.buyer.buyerAddress, bitcoin.networks.bitcoin)) {
      const redeemScript = bitcoin.payments.p2wpkh({
        pubkey: Buffer.from(listing.buyer.buyerPublicKey!, "hex"),
      }).output;
      const p2sh = bitcoin.payments.p2sh({
        redeem: { output: redeemScript },
      });
      p2shInputWitnessUTXOUn.witnessUtxo = {
        script: p2sh.output,
        value: utxo.value,
      } as WitnessUtxo;
      p2shInputRedeemScriptUn.redeemScript = p2sh.redeem?.output;
    }

    psbt.addInput({
      ...input,
      ...p2shInputWitnessUTXOUn,
      ...p2shInputRedeemScriptUn,
    });

    totalInput += utxo.value;
  }

  // Create a platform fee output
  let platformFeeValue = Math.floor((listing.seller.price * (0 + 100)) / 10000);
  platformFeeValue =
    platformFeeValue > DUMMY_UTXO_MIN_VALUE ? platformFeeValue : 0;

  console.log(platformFeeValue, "PLATFORM_FEE");
  if (platformFeeValue > 0) {
    psbt.addOutput({
      address: PLATFORM_FEE_ADDRESS,
      value: platformFeeValue,
    });
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
    listing.buyer.feeRateTier
  );

  const totalOutput = psbt.txOutputs.reduce(
    (partialSum, a) => partialSum + a.value,
    0
  );

  const changeValue =
    totalInput - (totalOutput) - fee;

  if (changeValue < 0) {
    throw `Your wallet address doesn't have enough funds to buy this inscription.
Price:      ${convertSatToBtc(listing.seller.price)} BTC
Required:   ${convertSatToBtc(totalOutput + fee)} BTC
Missing:    ${convertSatToBtc(-changeValue)} BTC`;
  }

  // Change utxo
  if (changeValue > DUMMY_UTXO_MIN_VALUE) {
    psbt.addOutput({
      address: listing.buyer.buyerAddress,
      value: changeValue+listing.seller.ordItem.output_value,
    });
  }

  
  console.log({ totalInput, totalOutput, fee, changeValue });

  // merge seller signature to unsigned buyer psbt
  if (listing.seller.signedListingPSBTBase64) {
    const sellerSignedPsbt = bitcoin.Psbt.fromBase64(listing.seller.signedListingPSBTBase64);
    (psbt.data.globalMap.unsignedTx as any).tx.ins[
      BUYING_PSBT_SELLER_SIGNATURE_INDEX
    ] = (sellerSignedPsbt.data.globalMap.unsignedTx as any).tx.ins[0];
    psbt.data.inputs[BUYING_PSBT_SELLER_SIGNATURE_INDEX] =
      sellerSignedPsbt.data.inputs[0];
  }
  

  listing.buyer.unsignedBuyingPSBTBase64 = psbt.toBase64();
  listing.buyer.unsignedBuyingPSBTInputSize = psbt.data.inputs.length;
  return listing;
}

async function getSellerInputAndOutput(listing: IListingState) {
  if (!listing.seller.ordItem.output) {
    throw Error("Inscription has no output")
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
  const sellerSignedPsbt = bitcoin.Psbt.fromBase64(signedListingPSBTBase64);
  const buyerSignedPsbt = bitcoin.Psbt.fromBase64(signedBuyingPSBTBase64);

  (buyerSignedPsbt.data.globalMap.unsignedTx as any).tx.ins[
    BUYING_PSBT_SELLER_SIGNATURE_INDEX
  ] = (sellerSignedPsbt.data.globalMap.unsignedTx as any).tx.ins[0];
  buyerSignedPsbt.data.inputs[BUYING_PSBT_SELLER_SIGNATURE_INDEX] =
    sellerSignedPsbt.data.inputs[0];

  return buyerSignedPsbt.toBase64();
}
