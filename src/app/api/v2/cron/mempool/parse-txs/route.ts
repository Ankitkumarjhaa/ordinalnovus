import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import dbConnect from "@/lib/dbConnect";
import moment from "moment";
import { Inscription, Tx } from "@/models";
import { IVOUT } from "@/types/Tx";
import { parseInscription } from "@/app/api/utils/parse-witness-data/route";

interface IInscriptionDetails {
  inscription_id: string;
  body: {
    location: string;
    offset: number;
    address: string;
    output: string;
    output_value: number;
    listed: boolean;
    listed_at: Date;
    listed_price: number;
    listed_maker_fee_bp: number;
    tap_internal_key: string;
    listed_seller_receive_address: string;
    signed_psbt: string;
    unsigned_psbt: string;
  };
}

async function fetchInscriptionsFromOutput(
  output: string
): Promise<IInscriptionDetails[]> {
  try {
    const apiUrl = `${process.env.NEXT_PUBLIC_PROVIDER}/api/output/${output}`;
    console.log(apiUrl, "apiUrl");
    const { data } = await axios.get(apiUrl);
    if (!data.inscription_details?.length) {
      return [];
    }
    const details = data.inscription_details.map((i: any) => ({
      inscription_id: i.inscription_id,
      body: {
        location: i.location,
        offset: Number(i.offset),
        address: data.address,
        output: i.output,
        output_value: Number(i.output_value.value),
        listed: false,
        listed_at: new Date(),
        listed_price: 0,
        listed_maker_fee_bp: 0,
        tap_internal_key: "",
        listed_seller_receive_address: "",
        signed_psbt: "",
        unsigned_psbt: "",
      },
    }));

    return details;
  } catch (error) {
    console.error(`Error fetching inscriptions for output ${output}:`, error);
    throw new Error("Failed to fetch inscriptions");
  }
}

const LIMIT = 100;
async function parseTxData(sort: 1 | -1, skip: number) {
  try {
    const modifiedTxIds: string[] = [];
    const modifiedInscriptionIds: string[] = [];
    const nonParsedTxs = await Tx.find({ parsed: false })
      .limit(LIMIT)
      .sort({ createdAt: sort })
      .skip(skip);

    const txBulkOps = [];
    const inscriptionBulkOps: any = [];

    if (!nonParsedTxs.length) {
      return {
        message: "No Transactions left to parse",
      };
    }

    console.log(
      `Parsing ${nonParsedTxs.length} Transactions. starting: ${nonParsedTxs[0].txid}`
    );

    for (const tx of nonParsedTxs) {
      const { txid, vout, vin, _id } = tx;
      modifiedTxIds.push(txid);
      let inscriptionIds: string[] = [];
      let isInscribed = false;

      const outputPromises = vout.map(async (v: IVOUT, index: number) => {
        if (v?.scriptpubkey_address?.startsWith("bc1p")) {
          const isInscribeTx = parseInscription({ vin });
          if (!isInscribeTx?.base64Data)
            return fetchInscriptionsFromOutput(`${txid}:${index}`);
        }
        return [];
      });

      const inscriptions = (await Promise.all(outputPromises)).flat();
      isInscribed = inscriptions.some((i) => i.inscription_id.startsWith(txid));

      inscriptionIds = inscriptions.map((i) => {
        modifiedInscriptionIds.push(i.inscription_id);
        return i.inscription_id;
      });

      inscriptions.forEach((i) => {
        inscriptionBulkOps.push({
          updateOne: {
            filter: { inscription_id: i.inscription_id },
            update: { $set: i.body },
          },
        });
      });

      txBulkOps.push({
        updateOne: {
          filter: { _id },
          update: {
            $set: {
              ...(inscriptionIds.length && { inscriptions: inscriptionIds }),
              ...(inscriptionIds.length > 0
                ? { tag: isInscribed ? "inscribed" : "others" }
                : {}),
              parsed: true,
            },
          },
        },
      });
    }

    if (txBulkOps.length > 0) {
      await Tx.bulkWrite(txBulkOps);
    }

    if (inscriptionBulkOps.length > 0) {
      await Inscription.bulkWrite(inscriptionBulkOps);
    }

    return {
      modifiedTxIds,
      modifiedInscriptionIds,
      inscriptionBulkOps,
      txBulkOps,
    };
  } catch (error) {
    console.error("Error in parsing transactions:", error);
  }
}

// async function parseTxData(sort: 1 | -1, skip: number) {
//   try {
//     const CHUNK_SIZE = 50; // Define a suitable chunk size
//     const modifiedTxIds: string[] = [];
//     const modifiedInscriptionIds: string[] = [];
//     const nonParsedTxs = await Tx.find({
//       parsed: false,
//     })
//       .limit(LIMIT)
//       .sort({ createdAt: sort })
//       .skip(skip);

//     const txBulkOps = [];
//     const inscriptionBulkOps: any = [];
//     let isInscribed = false;

//     if (!nonParsedTxs.length) {
//       return {
//         message: "No Transactions left to parse",
//       };
//     }

//     console.log(
//       `Parsing ${nonParsedTxs.length} Transactions. starting: ${nonParsedTxs[0].txid}`
//     );

//     for (const tx of nonParsedTxs) {
//       const { txid, vout, vin, _id } = tx;
//       modifiedTxIds.push(txid);
//       let inscriptionIds: string[] = [];

//       if (vout.length < 10) {
//         const chunkedOutputs = [];

//         for (let i = 0; i < vout.length; i += CHUNK_SIZE) {
//           chunkedOutputs.push(vout.slice(i, i + CHUNK_SIZE));
//         }

//         for (const chunk of chunkedOutputs) {
//           const outputPromises = chunk.map(async (v: IVOUT, index: number) => {
//             if (v?.scriptpubkey_address?.startsWith("bc1p")) {
//               const isInscribeTx = await parseInscription({ vin });
//               if (!isInscribeTx?.base64Data)
//                 return fetchInscriptionsFromOutput(`${txid}:${index}`);
//             }
//             return [];
//           });

//           const chunkedInscriptions = (
//             await Promise.all(outputPromises)
//           ).flat();

//           isInscribed = chunkedInscriptions.some((i) =>
//             i.inscription_id.startsWith(txid)
//           );

//           inscriptionIds = chunkedInscriptions.map((i) => {
//             modifiedInscriptionIds.push(i.inscription_id);
//             return i.inscription_id;
//           });

//           chunkedInscriptions.forEach((i) => {
//             inscriptionBulkOps.push({
//               updateOne: {
//                 filter: { inscription_id: i.inscription_id },
//                 update: { $set: i.body },
//               },
//             });
//           });
//         }
//       }

//       txBulkOps.push({
//         updateOne: {
//           filter: { _id },
//           update: {
//             $set: {
//               ...(inscriptionIds.length && { inscriptions: inscriptionIds }),
//               ...(inscriptionIds.length > 0
//                 ? { tag: isInscribed ? "inscribed" : "others" }
//                 : {}),
//               parsed: true,
//             },
//           },
//         },
//       });
//     }

//     if (txBulkOps.length > 0) {
//       await Tx.bulkWrite(txBulkOps);
//     }

//     if (inscriptionBulkOps.length > 0) {
//       await Inscription.bulkWrite(inscriptionBulkOps);
//     }

//     return {
//       modifiedTxIds,
//       modifiedInscriptionIds,
//       inscriptionBulkOps,
//       txBulkOps,
//     };
//   } catch (error) {
//     console.error("Error in parsing transactions:", error);
//   }
// }

// API Handler
export async function GET(req: NextRequest, res: NextResponse) {
  try {
    console.log(`***** Parse Txs [CRONJOB] Called *****`);
    await dbConnect();
    const fiveDayAgo = moment().subtract(5, "days").toDate();

    const query = {
      parsed: true,
      tag: { $exists: false },
      createdAt: { $lt: fiveDayAgo },
    };

    await Tx.deleteMany({ ...query });

    console.log("Starting parsing...");
    // const result = await parseTxData(1);
    const result = await Promise.allSettled([
      parseTxData(1, 0),
      parseTxData(1, LIMIT),
      parseTxData(-1, 0),
      parseTxData(-1, LIMIT),
    ]);

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

async function resetParsedAndRemoveFields() {
  try {
    await dbConnect();
    const updateQuery = {
      $set: { parsed: false },
      $unset: {
        inscriptions: "",
        from: "",
        to: "",
        price: "",
        tag: "",
      },
    };
    const updateOptions = { multi: true };
    const result: any = await Tx.updateMany({}, updateQuery, updateOptions);
    console.log(`${result.nModified} documents were updated.`);
  } catch (error) {
    console.error(
      "Error in resetting parsed field and removing specific fields:",
      error
    );
  }
}
