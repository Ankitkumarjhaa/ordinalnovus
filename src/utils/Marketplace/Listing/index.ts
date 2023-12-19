// utils/Marketplace/Listing/index.ts

import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";

// Initialize the bitcoinjs-lib library with secp256k1
bitcoin.initEccLib(ecc);

import { validatePsbt } from "..";

function verifySignature(signedListingPSBT: string): boolean {
  try {
    console.log("verifying psbt...");
    let psbt = bitcoin.Psbt.fromBase64(signedListingPSBT);

    // Verify that the seller has signed the PSBT if Ordinal is held on a taproot and tapInternalKey is present
    psbt.data.inputs.forEach((input: any, idx: number) => {
      if (input.tapInternalKey) {
        const finalScriptWitness = input.finalScriptWitness;
        console.log(finalScriptWitness, "FINAL");

        if (finalScriptWitness && finalScriptWitness.length > 0) {
          // Validate that the finalScriptWitness is not empty (and not just the initial value, without the tapKeySig)
          if (finalScriptWitness.toString("hex") === "0141") {
            throw new Error(
              `Invalid signature - no taproot signature present on the finalScriptWitness`
            );
          }
        } else {
          throw new Error(`Invalid signature - no finalScriptWitness`);
        }
      }
    });

    console.log("signature checked");

    // Verifies that the actual owner address has signed the PSBT
    return validatePsbt(signedListingPSBT);
  } catch (error) {
    // Handle the error here
    console.error("Error while verifying signature:", error);
    // You can return false, throw a custom error, or handle the error in any way you prefer.
    return false;
  }
}

function addFinalScriptWitness(signedListingPSBT: string): any {
  let newPSBT = null;
  try {
    let psbt = bitcoin.Psbt.fromBase64(signedListingPSBT);

    // Verify that the seller has signed the PSBT if Ordinal is held on a taproot and tapInternalKey is present
    psbt.data.inputs.forEach((input: any, idx: number) => {
      if (input.tapInternalKey) {
        const finalScriptWitness = input.finalScriptWitness;
        if (input.tapKeySig?.length && !finalScriptWitness?.length) {
          console.log(input.tapKeySig, "TAPKEYSIG");
          console.log(
            input.tapKeySig.__proto__.constructor([1, 65, ...input.tapKeySig]),
            "FINALSCRIPTWITNESS"
          );
          psbt.updateInput(idx, {
            finalScriptWitness: input.tapKeySig.__proto__.constructor([
              1,
              65,
              ...input.tapKeySig,
            ]),
          });
        }
      } else {
        psbt.finalizeInput(idx);
      }
    });
    newPSBT = psbt.toBase64();
    psbt.extractTransaction(true);

    // Verifies that the actual owner address has signed the PSBT
    return newPSBT;
  } catch (e: any) {
    if (e.message == "Not finalized") {
      throw Error("Please sign and finalize the PSBT before submitting it");
    } else if (e.message != "Outputs are spending more than Inputs") {
      throw Error("Invalid PSBT: " + e.message || e);
    } else {
      return newPSBT;
    }
  }
}

function isBase64(str: string): boolean {
  try {
    return btoa(atob(str)) === str;
  } catch (err) {
    return false;
  }
}

// TODO: This function checks if the PSBT has exactly one input
function verifyInputCount(signedListingPSBTBase64: string): boolean {
  const psbt = bitcoin.Psbt.fromBase64(signedListingPSBTBase64);
  return psbt.data.inputs.length === 1;
}

// TODO: This function verifies that the psbt input output_value matches the output value of the actual inscription
function verifyInscription(
  signedListingPSBTBase64: string,
  expectedOutputValue: number
): boolean {
  const psbt = bitcoin.Psbt.fromBase64(signedListingPSBTBase64);
  //  const output = psbt.txOutputs[0];
  const output: any = psbt.data.inputs[0].witnessUtxo;
  if (output.value !== expectedOutputValue) {
    throw new Error(`Invalid inscription`);
  }
  // Insert logic here
  return true;
}

// TODO: This function checks if the output address is the same as the seller's receive address
function verifyAddress(outputAddress: string, sellerAddress: string): boolean {
  // Insert logic here
  return outputAddress === sellerAddress;
}

function verifyPrice(signedListingPSBTBase64: string, price: number): boolean {
  const psbt = bitcoin.Psbt.fromBase64(signedListingPSBTBase64);
  const output = psbt.txOutputs[0];
  if (output.value !== price) {
    throw new Error(`Invalid price`);
  }
  return true;
}

export {
  verifySignature,
  verifyInputCount,
  verifyInscription,
  verifyAddress,
  addFinalScriptWitness,
};
