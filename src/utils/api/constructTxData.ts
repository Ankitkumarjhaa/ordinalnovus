import { parseInscription } from "@/app/api/utils/parse-witness-data/route";
import { IVIN, IVOUT } from "@/types/Tx";

type InputType = { address?: string; value?: number; type?: string };
type OutputType = { address?: string; value?: number; type?: string };

export function constructTxData(
  inscriptions: any[],
  inputs: IVIN[],
  outputs: IVOUT[],
  outputIndex?: number[]
): any {
  if (inscriptions.length === 0) {
    console.debug("Inscriptions not present");
    return null;
  }
  console.debug("Constructing transaction data...");

  const inputArray: InputType[] = inputs.map((input) => ({
    address: input.prevout?.scriptpubkey_address,
    value: input.prevout?.value,
    type: input.prevout?.scriptpubkey_type,
  }));

  const outputArray: OutputType[] = outputs.map((output) => ({
    address: output.scriptpubkey_address,
    value: output.value,
    type: output.scriptpubkey_type,
  }));

  console.debug("Input and Output arrays constructed.");

  let tag: string | null = null;
  let to: string | null = null;
  let from: string | null = null;
  let price: number | null = null;

  const { tag: inscribedTag, to: inscribedTo } = checkForInscribed(
    inputs,
    outputArray,
    inscriptions
  );

  if (inscribedTag) {
    console.debug(`Transaction tagged as 'inscribed'`);
    return {
      tag: inscribedTag,
      to: inscribedTo,
      inscriptions,
    };
  }

  if (inputs.length >= 4 && !tag) {
    const saleInfo = checkFor4InputSale(inputArray, outputArray);

    if (saleInfo) {
      console.debug("Valid sale detected.");
      return {
        tag: saleInfo.tag,
        to: saleInfo.toAddress,
        from: saleInfo.fromAddress,
        price: saleInfo.price,
        inscriptions,
      };
    }
  }

  if (!tag) {
    const { isTransfer, toAddress, fromAddress } = checkForTransfer(
      inputArray,
      outputArray
    );

    if (isTransfer && toAddress && fromAddress) {
      tag = "transfer";
      to = toAddress;
      from = fromAddress;
    }
  }

  console.log(
    {
      from,
      to,
      price,
      tag: tag && inscriptions.length ? tag : "other",
      inscriptions,
    },
    "RETURNING THIS"
  );
  console.debug("Transaction data construction completed.");
  throw Error("stop parsing");
  return {
    from,
    to,
    price,
    tag: tag && inscriptions.length ? tag : "other",
    inscriptions,
  };
}

function checkFor4InputSale(
  inputArray: InputType[],
  outputArray: OutputType[]
) {
  // Initialize return object
  let result: {
    fromAddress: string | null;
    toAddress: string | null;
    price: number | null;
    tag: string | null;
  } = {
    fromAddress: null,
    toAddress: null,
    price: null,
    tag: null,
  };

  // Validate the arrays contain at least the required number of elements
  if (inputArray.length < 3 || outputArray.length < 3) {
    return null; // Not enough elements to validate
  }

  // Check 1: first input value + second input value = first output value
  if (
    inputArray[0].value != null &&
    inputArray[1].value != null &&
    outputArray[0].value != null &&
    inputArray[0].value + inputArray[1].value === outputArray[0].value
  ) {
    // Check 2: third input address is of type v1_p2tr and starts with bc1p
    if (
      inputArray[2].address?.startsWith("bc1p") &&
      inputArray[2].type === "v1_p2tr"
    ) {
      // Check 3: 2nd output address is of type v1_p2tr and starts with bc1p
      if (
        outputArray[1].address?.startsWith("bc1p") &&
        outputArray[1].type === "v1_p2tr"
      ) {
        // Assign values to the result object
        result.fromAddress = inputArray[2].address;
        result.toAddress = outputArray[1].address;
        result.price = outputArray[2]?.value || null;
        result.tag = "sale";

        return result;
      }
    }
  }

  return null; // If any check fails, return null
}

const checkForTransfer = (
  inputArray: InputType[],
  outputArray: OutputType[]
): { isTransfer: boolean; toAddress?: string; fromAddress?: string } => {
  let isTransfer = false;
  let toAddress: string | undefined;
  let fromAddress: string | undefined;

  if (outputArray.length === 1) {
    // single taproot output transfer
    for (const input of inputArray) {
      const output = outputArray[0];
      if (input.type === "v1_p2tr" && output.type === "v1_p2tr") {
        isTransfer = true;
        toAddress = output.address;
        fromAddress = inputArray.find((a) => a.type === "v1_p2tr")?.address;
        break;
      }
    }
  } else {
    // multiple outputs transfer
    for (const input of inputArray) {
      for (const output of outputArray) {
        if (
          input.value === output.value &&
          (input.type === "v1_p2tr" || input?.address?.startsWith("bc1p")) &&
          (output.type === "v1_p2tr" || output?.address?.startsWith("bc1p"))
        ) {
          isTransfer = true;
          fromAddress = input.address;
          toAddress = output.address;
          break;
        }
      }
      if (isTransfer) {
        break;
      }
    }
  }

  return { isTransfer, toAddress, fromAddress };
};

interface InscribedCheckResult {
  tag: string | null;
  to: string | null;
}

const checkForInscribed = (
  vin: IVIN[],
  outputArray: any[],
  inscriptions: any[]
): InscribedCheckResult => {
  let tag = null;
  let to = null;

  try {
    const inscriptionInInput = parseInscription({ vin }); // Replace with actual function
    if (inscriptionInInput?.base64Data) {
      tag = "inscribed";
      const inscribedOutput = outputArray.find((a) => a.type === "v1_p2tr");
      to = inscribedOutput ? inscribedOutput.address : null;
    }
  } catch (e) {
    console.log("No inscription found in input");
  }

  return {
    tag,
    to,
  };
};
