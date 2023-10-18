import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import dbConnect from "@/lib/dbConnect";
import { Tx, Inscription } from "@/models";
import { IVIN, IVOUT } from "@/types/Tx";
import * as cheerio from "cheerio";
import moment from "moment";

async function fetchInscriptions(output: string): Promise<string[]> {
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

// Construct Transaction Data
function constructTxData(
  inscriptions: any[],
  inputs: IVIN[],
  outputs: IVOUT[],
  outputIndex?: number[]
): any {
  let tag = "other";
  if (inscriptions.length !== 1) return null;

  // Add a condition to check if the value in vin and vout are equal
  for (let i = 0; i < inputs.length; i++) {
    for (let j = 0; j < outputs.length; j++) {
      if (inputs[i]?.prevout?.value === outputs[j]?.value) {
        if (
          inputs[i]?.prevout?.value === outputs[j]?.value &&
          inputs[i]?.prevout?.scriptpubkey_address?.startsWith("bc1p") &&
          outputs[j]?.scriptpubkey_address?.startsWith("bc1p")
        )
          tag = "transfer";
      }
    }
  }

  if (
    outputs[1] &&
    outputs[1].scriptpubkey_address &&
    outputs[1].scriptpubkey_address.startsWith("bc1p") &&
    outputs[2]?.value !== undefined
  )
    return {
      from: inputs[2]?.prevout?.scriptpubkey_address,
      to: outputs[1].scriptpubkey_address,
      price: outputs[2].value,
      tag: "sale",
      inscriptions,
    };
  else
    return {
      inscriptions,
      tag,
    };
}

async function fetchInscriptionDetails(tokenId: string) {
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

// Parse Transactions to Database

async function parseTxData(sort: 1 | -1) {
  const bulkOps: Array<any> = [];
  const inscriptionTxIds: { txid: string; inscriptions: any }[] = [];
  const bulkOpsInscription: Array<any> = [];

  const unparsedTxs = await Tx.find({ parsed: false })
    .limit(200)
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
    (ins) => ins && ins.length > 0
  );

  for (const [index, inscriptions] of filteredInscriptions.entries()) {
    const key = Object.keys(txIndexMap)[index];
    const { txid, inputs, outputs, index: outputIndex } = txIndexMap[key];
    const outputsWithInscriptions: { [key: string]: any } = {};

    if (inscriptions && inscriptions.length > 0) {
      // Storing the output index that has inscriptions
      if (!outputsWithInscriptions[txid]) {
        outputsWithInscriptions[txid] = [];
      }
      outputsWithInscriptions[txid].push(outputIndex);

      const txData = constructTxData(inscriptions, inputs, outputs);
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

      console.log("bulkops pushed");

      inscriptionTxIds.push({
        txid,
        inscriptions,
      });

      console.log("create promises");

      // Create an array of Promises
      const fetchDetailsPromises: Promise<any>[] = inscriptions.map(
        async (inscriptionId: any) => {
          // Your async logic here
          const inscriptionDetails = await fetchInscriptionDetails(
            inscriptionId
          );
          return {
            inscriptionId,
            details: inscriptionDetails,
          };
        }
      );

      console.log("first");

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
    console.log("update tx data");
    await Tx.bulkWrite(bulkOps, { ordered: false });
  }

  if (bulkOpsInscription.length > 0) {
    console.log("update ins data");
    await Inscription.bulkWrite(bulkOpsInscription, { ordered: false });
  }

  return inscriptionTxIds;
}

// API Handler
export async function GET(req: NextRequest, res: NextResponse) {
  try {
    await dbConnect();
    const oneDayAgo = moment().subtract(1, "days").toDate();

    const query = {
      parsed: true,
      price: { $exists: false },
      createdAt: { $lt: oneDayAgo },
    };

    await Tx.deleteMany(query);

    console.log(`***** Parse Txs [CRONJOB] Called *****`);

    const result = await parseTxData(1);
    // const result = await Promise.all([parseTxData(1), parseTxData(-1)]);

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
  } finally {
    return NextResponse.json({
      message: "Processing completed, check logs for details",
    });
  }
}
