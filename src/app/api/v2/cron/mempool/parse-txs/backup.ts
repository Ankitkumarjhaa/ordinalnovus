import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import dbConnect from "@/lib/dbConnect";
import { Tx, Inscription } from "@/models";
import { IVIN, IVOUT } from "@/types/Tx";
import * as cheerio from "cheerio";
import moment from "moment";
import { IInscription } from "@/types/Ordinals";
import { parseInscription } from "@/app/api/utils/parse-witness-data/route";

async function fetchInscriptionsFromOrd(output: string): Promise<string[]> {
  try {
    console.log("fetching...", `https://ordinals.com/output/${output}`);
    const response = await axios.get(`https://ordinals.com/output/${output}`);
    const htmlText = response.data;

    const inscriptionIds: string[] = [];
    const regex = /href=\/inscription\/([a-zA-Z0-9]+i\d+)/g;
    let match;

    while ((match = regex.exec(htmlText)) !== null) {
      console.log(match[1], "match");
      inscriptionIds.push(match[1]);
    }

    console.log("found ", inscriptionIds);
    return inscriptionIds;
  } catch (error) {
    console.error(`Error fetching inscriptions for output ${output}:`, error);
    throw new Error("Failed to fetch inscriptions");
  }
}

async function fetchInscriptions(
  output: string
): Promise<{ inscriptions: string[]; output: number }> {
  try {
    console.log(
      "fetching...",
      `${process.env.NEXT_PUBLIC_PROVIDER}/api/output/${output}`
    );
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_PROVIDER}/api/output/${output}`
    );
    return {
      inscriptions: response.data.inscriptions,
      output: Number(output.split(":")[1]),
    };
    // return inscriptionIds;
  } catch (error) {
    console.error(`Error fetching inscriptions for output ${output}:`, error);
    throw new Error("Failed to fetch inscriptions");
  }
}

function constructTxData(
  inscriptions: any[],
  inputs: IVIN[],
  outputs: IVOUT[],
  outputIndex?: number[]
): any {
  // console.debug("Start: constructTxData function");
  // console.debug(`Received inscriptions: ${JSON.stringify(inscriptions)}`);
  // console.debug(`Received inputs: ${JSON.stringify(inputs)}`);
  // console.debug(`Received outputs: ${JSON.stringify(outputs)}`);
  // console.debug(`Received outputIndex: ${JSON.stringify(outputIndex)}`);

  let tag = null;
  // console.debug(`Initial tag value: ${tag}`);

  if (inscriptions.length) {
    console.debug(`Inscriptions not present`);
    return null;
  }

  const equalValuePairs: { inputIndex: number; outputIndex: number }[] = [];

  // Check for 'inscribed' condition
  const tx = { vin: inputs };
  let inscriptionInInput = null;
  try {
    inscriptionInInput = parseInscription(tx);
  } catch (e) {
    console.log("no inscription found in input");
  }

  if (inscriptionInInput?.base64Data) {
    console.debug(`Tag updated to 'inscribed'`);
    return {
      tag: "inscribed",
      inscriptions,
      to: outputs.filter((a) => a.scriptpubkey_type === "v1_p2tr")[0]
        .scriptpubkey_address,
    };
  } else if (
    (inputs.length === 4 || inputs.length === 5) &&
    outputs[2]?.value !== undefined
  ) {
    const inputAddressCount: Map<string, number> = new Map();
    const outputAddressCount: Map<string, number> = new Map();

    // Count unique addresses in inputs
    inputs.forEach((input) => {
      const address = input.prevout?.scriptpubkey_address;
      if (address) {
        inputAddressCount.set(
          address,
          (inputAddressCount.get(address) || 0) + 1
        );
      }
    });

    const from: string[] = [];

    inputAddressCount.forEach((count, address) => {
      if (count === 1 && address.startsWith("bc1p")) {
        from.push(address);
      }
    });

    // Count unique addresses in outputs
    outputs.forEach((output) => {
      const address = output.scriptpubkey_address;
      if (address) {
        outputAddressCount.set(
          address,
          (outputAddressCount.get(address) || 0) + 1
        );
      }
    });

    console.log("Input Address Count:", inputAddressCount);
    console.log("Output Address Count:", outputAddressCount);
    console.debug(`Tag updated to 'sale'`);
    return {
      from: from[0],
      to: outputs[1].scriptpubkey_address,
      price: outputs[2].value,
      tag: "sale",
      inscriptions,
    };
  } else {
    console.log("looping");
    for (let i = 0; i < inputs.length; i++) {
      for (let j = 0; j < outputs.length; j++) {
        console.log(inputs[i]?.prevout?.value + " == " + outputs[j]?.value);
        if (inputs[i]?.prevout?.value === outputs[j]?.value) {
          console.log("found equal pairs");
          equalValuePairs.push({ inputIndex: i, outputIndex: j });

          if (
            inputs[i]?.prevout?.scriptpubkey_address?.startsWith("bc1p") &&
            outputs[j]?.scriptpubkey_address?.startsWith("bc1p")
          ) {
            tag = "transfer";
            console.debug(
              `Tag updated to 'transfer' based on address condition`
            );
          }
        }
      }
    }

    console.debug(`Equal value pairs: ${JSON.stringify(equalValuePairs)}`);
    console.debug(`Returning inscriptions and tag: ${tag}`);
    return {
      inscriptions,
      tag: "other",
    };
  }
}

// Construct Transaction Data
function constructTxDataBackup(
  inscriptions: any[],
  inputs: IVIN[],
  outputs: IVOUT[],
  outputIndex?: number[]
): any {
  console.debug("Start: constructTxData function");
  console.debug(`Received inscriptions: ${JSON.stringify(inscriptions)}`);
  // console.debug(`Received inputs: ${JSON.stringify(inputs)}`);
  // console.debug(`Received outputs: ${JSON.stringify(outputs)}`);
  console.debug(`Received outputIndex: ${JSON.stringify(outputIndex)}`);

  let tag = null;
  console.debug(`Initial tag value: ${tag}`);

  if (inscriptions.length !== 1) {
    console.debug(`Inscriptions length is not 1. Returning null.`);
    return null;
  }

  const equalValuePairs: { inputIndex: number; outputIndex: number }[] = [];

  console.debug(`Equal value pairs: ${JSON.stringify(equalValuePairs)}`);

  // Check for 'inscribed' condition
  const tx = { vin: inputs };
  let inscriptionInInput = null;
  try {
    inscriptionInInput = parseInscription(tx);
  } catch (e) {
    console.log("no inscription found in input");
  }
  console.log(inscriptionInInput, "INSCRIPTION IN INPUT WITNESS");
  if (inscriptionInInput?.base64Data) {
    console.debug(`Tag updated to 'inscribed'`);
    return {
      tag: "inscribed",
      inscriptions,
      to: outputs.filter((a) => a.scriptpubkey_type === "v1_p2tr")[0]
        .scriptpubkey_address,
    };
  } else if (
    (inputs.length === 4 || inputs.length === 5) &&
    // outputs[1] &&
    // outputs[1].scriptpubkey_address &&
    // outputs[1].scriptpubkey_address.startsWith("bc1p") &&
    outputs[2]?.value !== undefined
  ) {
    const inputAddressCount: Map<string, number> = new Map();
    const outputAddressCount: Map<string, number> = new Map();

    // Count unique addresses in inputs
    inputs.forEach((input) => {
      const address = input.prevout?.scriptpubkey_address;
      if (address) {
        inputAddressCount.set(
          address,
          (inputAddressCount.get(address) || 0) + 1
        );
      }
    });

    const from: string[] = [];

    inputAddressCount.forEach((count, address) => {
      if (count === 1 && address.startsWith("bc1p")) {
        from.push(address);
      }
    });

    // Count unique addresses in outputs
    outputs.forEach((output) => {
      const address = output.scriptpubkey_address;
      if (address) {
        outputAddressCount.set(
          address,
          (outputAddressCount.get(address) || 0) + 1
        );
      }
    });

    console.log("Input Address Count:", inputAddressCount);
    console.log("Output Address Count:", outputAddressCount);
    console.debug(`Tag updated to 'sale'`);
    return {
      from: from[0],
      to: outputs[1].scriptpubkey_address,
      price: outputs[2].value,
      tag: "sale",
      inscriptions,
    };
  } else {
    for (let i = 0; i < inputs.length; i++) {
      for (let j = 0; j < outputs.length; j++) {
        if (inputs[i]?.prevout?.value === outputs[j]?.value) {
          equalValuePairs.push({ inputIndex: i, outputIndex: j });

          if (
            inputs[i]?.prevout?.scriptpubkey_address?.startsWith("bc1p") &&
            outputs[j]?.scriptpubkey_address?.startsWith("bc1p")
          ) {
            tag = "transfer";
            console.debug(
              `Tag updated to 'transfer' based on address condition`
            );
            return {
              inscriptions,
              tag: "transfer",
            };
          }
        }
      }
    }
    console.debug(`Returning inscriptions and tag: ${tag}`);
    return {
      inscriptions,
      tag: "other",
    };
  }
}

async function fetchInscriptionDetailsFromOrd(tokenId: string) {
  const url = `https://ordinals.com/inscription/${tokenId}`;

  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const data = {
      id: $(".monospace").eq(0).text(),
      address: $(".monospace").eq(1).text(),
      output_value: Number(
        $("dt")
          .filter((_, el) => $(el).text() === "output value")
          .next()
          .text()
      ),
      contentType: $("dt")
        .filter((_, el) => $(el).text() === "content type")
        .next()
        .text(),
      timestamp: $("time").text(),
      location: $("dt")
        .filter((_, el) => $(el).text() === "location")
        .next()
        .text(),
      output: $('a.monospace[href^="/output"]').text(),
      offset: $("dt")
        .filter((_, el) => $(el).text() === "offset")
        .next()
        .text(),
    };

    return data;
  } catch (error) {
    throw new Error(
      `Failed to fetch Inscription data for inscription: ${tokenId}`
    );
  }
}

// Function to fetch details of a single inscription
async function fetchInscriptionDetails(
  inscriptionId: string
): Promise<
  Partial<IInscription> | { error: true; error_tag: string; error_retry: 1 }
> {
  try {
    const { data } = await axios.get(
      `${process.env.NEXT_PUBLIC_PROVIDER}/api/inscription/${inscriptionId}`
    );

    return {
      output_value: data.output_value,
      location: data.location,
      address: data.address,
      output: data.output,
      offset: data.offset,
    };
  } catch (error: any) {
    throw error;
  }
}

// Parse Transactions to Database

async function parseTxData(sort: 1 | -1) {
  const bulkOps: Array<any> = [];
  const inscriptionTxIds: { txid: string; inscriptions: any }[] = [];
  const bulkOpsInscription: Array<any> = [];

  const unparsedTxs = await Tx.find({ parsed: false })
    .limit(10)
    .sort({ height: sort });
  if (!unparsedTxs.length) {
    return NextResponse.json({
      message: "No Transactions left to parse",
      //    InscriptionData: result,
    });
  }
  console.log(
    `Parsing ${unparsedTxs.length} Transactions. starting: ${unparsedTxs[0].txid} height: ${unparsedTxs[0].height}`
  );

  const fetchInscriptionsPromises: Promise<any>[] = [];
  const txIndexMap: {
    [key: string]: { txid: string; inputs: any; outputs: any; index: number };
  } = {};

  // Initialize a set to keep track of transactions that are updated
  const updatedTxSet = new Set<string>();

  for (const { vin: inputs, vout: outputs, txid } of unparsedTxs) {
    if (
      //(inputs.length === 1 || inputs.length === 4) &&
      outputs.length <= 10
    )
      outputs.forEach((output: any, i: number) => {
        if (output?.scriptpubkey_address?.startsWith("bc1p")) {
          const key = `${txid}:${i}`;
          fetchInscriptionsPromises.push(fetchInscriptions(key));
          txIndexMap[key] = { txid, inputs, outputs, index: i };
        }
      });
  }

  console.log("Possible inscriptions output");
  async function fetchAllInscriptions(
    fetchInscriptionsPromises: Promise<any>[]
  ) {
    const chunkSize = 50;
    let allInscriptions: any[] = [];

    for (let i = 0; i < fetchInscriptionsPromises.length; i += chunkSize) {
      const chunk = fetchInscriptionsPromises.slice(i, i + chunkSize);
      const chunkResults = await Promise.all(chunk);
      allInscriptions = allInscriptions.concat(chunkResults);
    }

    return allInscriptions;
  }

  // Usage in your main function
  const allInscriptions = await fetchAllInscriptions(fetchInscriptionsPromises);

  // console.log(allInscriptions, "found inscriptions");
  // Remove empty items
  const filteredInscriptions = allInscriptions.filter(
    (ins) => ins.inscriptions && ins.inscriptions.length > 0
  );
  console.log(filteredInscriptions, "FI");

  for (const [index, data] of filteredInscriptions.entries()) {
    const inscriptions = data.inscriptions;
    const output = data.output;
    const key = Object.keys(txIndexMap)[output];
    const { txid, inputs, outputs, index: outputIndex } = txIndexMap[key];
    console.log(
      { txid, outputIndex },
      " position of inscription in a tx output"
    );
    const outputsWithInscriptions: { [key: string]: any } = {};

    if (inscriptions && inscriptions.length > 0) {
      // Storing the output index that has inscriptions
      if (!outputsWithInscriptions[txid]) {
        outputsWithInscriptions[txid] = [];
      }
      outputsWithInscriptions[txid].push(outputIndex);

      const txData = constructTxData(inscriptions, inputs, outputs, output);
      console.log(txData, "txdata");
      bulkOps.push({
        updateOne: {
          filter: { txid: txid },
          update: {
            $set: {
              ...txData,
              parsed: true,
            },
          },
        },
      });

      updatedTxSet.add(txid);

      if (txData?.to)
        inscriptionTxIds.push({
          txid,
          inscriptions,
        });

      // Create an array of Promises
      const fetchDetailsPromises: Promise<any>[] = inscriptions.map(
        async (inscriptionId: any) => {
          let inscriptionDetails = {};
          // Your async logic here
          try {
            inscriptionDetails = await fetchInscriptionDetails(inscriptionId);
          } catch (error) {
            console.error(
              `[Ordinalnovus is down] Failed to fetch details using fetchInscriptionDetails for ID: ${inscriptionId}, error: ${error}`
            );
            try {
              inscriptionDetails = await fetchInscriptionDetailsFromOrd(
                inscriptionId
              );
            } catch (secondError) {
              console.error(
                `[Ordinals is down] Failed to fetch details using fetchInscriptionDetailsFromOrd for ID: ${inscriptionId}, error: ${secondError}`
              );
            }
          }
          return {
            inscriptionId,

            details: inscriptionDetails,
          };
        }
      );

      // Wait for all Promises to resolve
      const allInscriptionDetails = await Promise.all(fetchDetailsPromises);
      console.log(allInscriptionDetails, "allInsDetails");

      // Loop through all resolved data
      allInscriptionDetails.forEach(({ inscriptionId, details }) => {
        const { address, location, offset, output, output_value } = details;
        console.log(
          {
            update: {
              address,
              location,
              offset,
              output,
              output_value,
            },
            filter: { inscription_id: inscriptionId },
          },
          "inscription data update"
        );
        bulkOpsInscription.push({
          updateOne: {
            filter: { inscription_id: inscriptionId },
            update: {
              address,
              location,
              offset,
              output,
              output_value,
            },
          },
        });
      });
    }
  }

  // Update the transactions that are not in updatedTxSet with parsed=true
  unparsedTxs.forEach(({ txid }) => {
    if (!updatedTxSet.has(txid)) {
      bulkOps.push({
        updateOne: {
          filter: { txid },
          update: { $set: { parsed: true } },
          // upsert: true,
        },
      });
    }
  });

  if (bulkOps.length > 0) {
    await Tx.bulkWrite(bulkOps, { ordered: false });
  }

  if (bulkOpsInscription.length > 0) {
    await Inscription.bulkWrite(bulkOpsInscription, { ordered: false });
  }

  return { inscriptionTxIds, txIndexMap };
}

// API Handler
export async function GET(req: NextRequest, res: NextResponse) {
  try {
    console.log(`***** Parse Txs [CRONJOB] Called *****`);
    await dbConnect();
    const oneDayAgo = moment().subtract(1, "days").toDate();

    const query = {
      parsed: true,
      tag: { $exists: false },
      // createdAt: { $lt: oneDayAgo },
    };

    console.log("Starting parsing...");

    const result = await parseTxData(-1);
    // await setAllParsedToFalse();
    // const result = await Promise.allSettled([parseTxData(1), parseTxData(-1)]);

    // await Tx.deleteMany({ ...query });

    return NextResponse.json({
      message: "Processing completed, check logs for details",
      InscriptionData: result,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error fetching and saving txids" },
      { status: 500 }
    );
  }
}

async function setAllParsedToFalse() {
  try {
    await Tx.updateMany(
      {},
      {
        $set: { parsed: false },
        $unset: { inscriptions: "", to: "", tag: "", from: "", price: "" },
      }
    );
    console.log("All documents have been updated.");
  } catch (error) {
    console.error("An error occurred:", error);
  }
}
