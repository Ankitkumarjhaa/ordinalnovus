import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import dbConnect from "@/lib/dbConnect";
import { Block, Tx, Inscription } from "@/models";
import { IVIN, IVOUT, MempoolBlockTx } from "@/types/Tx";
import { ObjectId } from "mongodb";
import moment from "moment";

// Fetch Inscriptions
async function fetchInscriptions(output: string): Promise<any[]> {
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_PROVIDER}/api/output/${output}`
    );
    return response.data?.inscriptions || [];
  } catch (error) {
    console.error(`Error fetching inscriptions for output ${output}:`, error);
    throw new Error("Failed to fetch inscriptions");
  }
}

// Construct Transaction Data
function constructTxData(
  inscriptions: any[],
  inputs: IVIN[],
  outputs: IVOUT[]
): any {
  if (inscriptions.length !== 1) return null;

  if (
    outputs[1] &&
    outputs[1].scriptpubkey_address &&
    outputs[1].scriptpubkey_address.startsWith("bc1p") &&
    outputs[2].value !== undefined
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
      tag: "others",
    };
}

// Fetch Inscription Details
async function fetchInscriptionDetails(inscriptionId: string): Promise<any> {
  const response = await axios.get(
    `${process.env.NEXT_PUBLIC_PROVIDER}/api/inscription/${inscriptionId}`
  );
  return response.data;
}

// Add Transactions to Database

// async function addBlockTxToDB(blockhash: string) {
//   const bulkOps: Array<any> = [];
//   const inscriptionTxIds: { txid: string; inscriptions: any }[] = [];
//   const bulkOpsInscription: Array<any> = [];

//   const unparsedTxs = await Tx.find({ parsed: false }).limit(1000);
//   console.log(unparsedTxs.length, " txes are being procesed");
//   for (const item of unparsedTxs) {
//     const { vin: inputs, vout: outputs, txid } = item;

//     for (let i = 0; i < outputs.length; i++) {
//       const output = outputs[i];

//       // Check if the address starts with 'bc1p'
//       if (
//         output &&
//         output.scriptpubkey_address &&
//         output.scriptpubkey_address.startsWith("bc1p")
//       ) {
//         console.log(`found taproot address at : ${txid}:${i}`);
//         // Fetch inscriptions for the specific output
//         const inscriptions = await fetchInscriptions(`${txid}:${i}`);

//         console.log(`got inscriptions `, inscriptions.length);

//         // Process inscriptions as needed
//         if (inscriptions && inscriptions.length) {
//           const txData = constructTxData(inscriptions, inputs, outputs);

//           // Update instead of inserting
//           bulkOps.push({
//             updateOne: {
//               filter: { txid: txid },
//               update: {
//                 $set: {
//                   ...txData,
//                   parsed: true,
//                 },
//               },
//               upsert: true, // optional, depending on whether you'd like to insert if tx doesn't exist
//             },
//           });

//           inscriptionTxIds.push({
//             txid,
//             inscriptions,
//           });
//         }
//       }
//     }
//   }

//   if (bulkOps.length > 0) {
//     await Tx.bulkWrite(bulkOps, { ordered: false });
//   }

//   for (const { txid, inscriptions } of inscriptionTxIds) {
//     for (const inscriptionId of inscriptions) {
//       const inscriptionDetails = await fetchInscriptionDetails(inscriptionId);
//       const { address, location, offset, output, output_value } =
//         inscriptionDetails;

//       // Update Inscription Collection
//       bulkOpsInscription.push({
//         updateOne: {
//           filter: { inscription_id: inscriptionId },
//           update: {
//             address,
//             location,
//             offset,
//             output,
//             output_value,
//           },
//         },
//       });
//     }
//   }

//   if (bulkOpsInscription.length > 0) {
//     await Inscription.bulkWrite(bulkOpsInscription, { ordered: false });
//   }

//   return inscriptionTxIds;
// }

async function parseTxData() {
  const bulkOps: Array<any> = [];
  const inscriptionTxIds: { txid: string; inscriptions: any }[] = [];
  const bulkOpsInscription: Array<any> = [];

  const unparsedTxs = await Tx.find({ parsed: false })
    .limit(200)
    .sort({ height: 1 });
  if (!unparsedTxs.length) {
    return NextResponse.json({
      message: "No Transactions left to parse",
      //    InscriptionData: result,
    });
  }
  console.log(`Parsing ${unparsedTxs.length} Transactions`);

  const fetchInscriptionsPromises: Promise<any>[] = [];
  const txIndexMap: {
    [key: string]: { txid: string; inputs: any; outputs: any; index: number };
  } = {};

  // Initialize a set to keep track of transactions that are updated
  const updatedTxSet = new Set<string>();

  for (const { vin: inputs, vout: outputs, txid } of unparsedTxs) {
    outputs.forEach((output: any, i: number) => {
      if (output?.scriptpubkey_address?.startsWith("bc1p")) {
        const key = `${txid}:${i}`;
        fetchInscriptionsPromises.push(fetchInscriptions(key));
        txIndexMap[key] = { txid, inputs, outputs, index: i };
      }
    });
  }

  const allInscriptions = await Promise.all(fetchInscriptionsPromises);
  // Remove empty items
  const filteredInscriptions = allInscriptions.filter(
    (ins) => ins && ins.length > 0
  );

  filteredInscriptions.forEach((inscriptions, index) => {
    const key = Object.keys(txIndexMap)[index];
    const { txid, inputs, outputs } = txIndexMap[key];

    if (inscriptions && inscriptions.length > 0) {
      const txData = constructTxData(inscriptions, inputs, outputs);
      bulkOps.push({
        updateOne: {
          filter: { txid: txid },
          update: {
            $set: {
              ...txData,
              parsed: true,
            },
          },
          upsert: true,
        },
      });

      updatedTxSet.add(txid);

      inscriptionTxIds.push({
        txid,
        inscriptions,
      });

      inscriptions.forEach(async (inscriptionId: any) => {
        // Note: fetchInscriptionDetails could be optimized in a similar way to fetchInscriptions
        const inscriptionDetails = await fetchInscriptionDetails(inscriptionId);
        const { address, location, offset, output, output_value } =
          inscriptionDetails;
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
  });
  // Update the transactions that are not in updatedTxSet with parsed=true
  unparsedTxs.forEach(({ txid }) => {
    if (!updatedTxSet.has(txid)) {
      bulkOps.push({
        updateOne: {
          filter: { txid },
          update: { $set: { parsed: true } },
          upsert: true,
        },
      });
    }
  });

  //   console.log(bulkOps, "bulkops");
  if (bulkOps.length > 0) {
    await Tx.bulkWrite(bulkOps, { ordered: false });
  }

  if (bulkOpsInscription.length > 0) {
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

    const result = await parseTxData();
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
