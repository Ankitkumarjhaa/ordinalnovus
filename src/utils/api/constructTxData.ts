import { parseInscription } from "@/app/api/utils/parse-witness-data/route";
import { IVIN, IVOUT } from "@/types/Tx";

type InputType = { address?: string; value?: number; type?: string };
type OutputType = { address?: string; value?: number; type?: string };
type ITXDATAWITHOUTTXID = {
  from: string;
  to: string;
  price: number;
  tag: string;
  marketplace: string;
  fee?: number;
};

export type ITXDATA = ITXDATAWITHOUTTXID & {
  txid: string;
  inscription_id: string; // Consider defining a more specific type instead of 'any[]' if possible
};

export function constructTxData(
  inscription_id: string,
  inputs: IVIN[],
  outputs: IVOUT[]
): ITXDATA | null {
  if (!inscription_id) {
    // console.debug("Inscriptions not present");
    return null;
  }
  // console.debug("Constructing transaction data...");

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

  // console.debug("Input and Output arrays constructed.");

  let tag: string | null = null;
  let to: string | null = null;
  let from: string | null = null;
  let price: number | null = null;

  if (inputs.length >= 4 && !tag) {
    const saleInfo = checkFor4InputSale(inputArray, outputArray);

    if (saleInfo) {
      // console.debug("Valid sale detected.");
      return {
        tag: saleInfo.tag,
        to: saleInfo.to,
        from: saleInfo.from,
        price: saleInfo.price,
        inscription_id,
        txid: inscription_id.split("i")[0],
        marketplace: saleInfo.marketplace,
        fee: saleInfo.fee,
      };
    }
  }

  if (!tag) {
    const transferCheck = checkForTransfer(inputArray, outputArray);

    if (transferCheck) {
      tag = transferCheck.tag;
      to = transferCheck.to;
      from = transferCheck.from;
    }
  }

  // console.log(
  //   {
  //     from,
  //     to,
  //     price,
  //     tag: tag && inscription_id ? tag : "other",
  //     inscription_id,
  //   },
  //   "RETURNING THIS"
  // );
  // console.debug("Transaction data construction completed.");
  return {
    from: from || "",
    to: to || "",
    price: price || 0,
    tag: tag && inscription_id ? tag : "other",
    inscription_id,
    txid: inscription_id.split("i")[0],
    marketplace: "",
  };
}

const V1_P2TR_TYPE = "v1_p2tr";
const BC1P_PREFIX = "bc1p";

function checkFor4InputSale(
  inputArray: InputType[],
  outputArray: OutputType[]
): ITXDATAWITHOUTTXID | null {
  if (inputArray.length < 3 || outputArray.length < 3) {
    return null;
  }

  // Marketplace addresses and their corresponding names
  const marketplaces = {
    bc1qcq2uv5nk6hec6kvag3wyevp6574qmsm9scjxc2: "magiceden",
    bc1qhg8828sk4yq6ac08rxd0rh7dzfjvgdch3vfsm4: "ordinalnovus",
    bc1p6yd49679azsaxqgtr52ff6jjvj2wv5dlaqwhaxarkamevgle2jaqs8vlnr:
      "ordinalswallet",
    bc1ppq8dyvkj4le0v0v4v4mdkw20ga7l0u9fhd8wtd67cdh36x6rchtsudyat9: "satsx",
  };

  let marketplace = "";
  let fee = 0;

  // Iterate over the marketplaces to find a match
  for (const [address, name] of Object.entries(marketplaces)) {
    if (outputArray.some((a) => a.address === address)) {
      marketplace = name;
      fee = outputArray.find((a) => a.address === address)?.value || 0;
      break; // Stop searching once a marketplace is found
    }
  }

  const isValueMatch =
    inputArray[0].value != null &&
    inputArray[1].value != null &&
    outputArray[0].value != null &&
    inputArray[0].value + inputArray[1].value === outputArray[0].value;

  // const isInputValid =
  //   inputArray[2].address?.startsWith(BC1P_PREFIX) &&
  //   inputArray[2].type === V1_P2TR_TYPE;

  // const isOutputValid =
  //   outputArray[1].address?.startsWith(BC1P_PREFIX) &&
  //   outputArray[1].type === V1_P2TR_TYPE;

  if (isValueMatch) {
    const result: ITXDATAWITHOUTTXID = {
      from: inputArray[2].address || "",
      to: outputArray[1].address || "",
      price: outputArray[2]?.value || 0, // Assuming price is a number and should default to 0 if not set
      tag: "sale",
      marketplace,
      fee,
    };

    return result;
  }

  return null;
}

const checkForTransfer = (
  inputArray: InputType[],
  outputArray: OutputType[]
): ITXDATAWITHOUTTXID | null => {
  let isTransfer = false;
  let to: string | undefined;
  let from: string | undefined;

  if (outputArray.length === 1) {
    // single taproot output transfer
    for (const input of inputArray) {
      const output = outputArray[0];
      if (input.type === V1_P2TR_TYPE && output.type === V1_P2TR_TYPE) {
        isTransfer = true;
        to = output.address;
        from = inputArray.find((a) => a.type === V1_P2TR_TYPE)?.address;
        break;
      }
    }
  } else {
    // multiple outputs transfer
    for (const input of inputArray) {
      for (const output of outputArray) {
        if (
          input.value === output.value &&
          (input.type === V1_P2TR_TYPE ||
            input?.address?.startsWith(BC1P_PREFIX)) &&
          (output.type === V1_P2TR_TYPE ||
            output?.address?.startsWith(BC1P_PREFIX))
        ) {
          isTransfer = true;
          from = input.address;
          to = output.address;
          break;
        }
      }
      if (isTransfer) {
        break;
      }
    }
  }

  if (isTransfer && to && from)
    return { tag: "transfer", to, from, price: 0, marketplace: "" };
  else return null;
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
    // console.log("No inscription found in input");
  }

  return {
    tag,
    to,
  };
};
