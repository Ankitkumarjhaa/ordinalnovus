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
  return {
    from: inputs[2]?.prevout?.scriptpubkey_address,
    to: outputs[1].scriptpubkey_address,
    price: outputs[2].value,
    inscriptions,
  };
}

// Fetch Inscription Details
async function fetchInscriptionDetails(inscriptionId: string): Promise<any> {
  const response = await axios.get(
    `${process.env.NEXT_PUBLIC_PROVIDER}/api/inscription/${inscriptionId}`
  );
  return response.data;
}

async function fetchBlockhashFromHeight(height: number): Promise<string> {
  const tipResponse = await axios.get(
    "https://mempool.space/api/block-height/" + height
  );
  return tipResponse.data;
}

async function fetchBlockDetails(latestBlockhash: string): Promise<any> {
  const blockDetailsResponse = await axios.get(
    `https://mempool.space/api/block/${latestBlockhash}`
  );
  return blockDetailsResponse.data;
}

async function upsertBlockData(latestBlockhash: string) {
  const blockDetails = await fetchBlockDetails(latestBlockhash);
  const dbBlockDetail = await Block.findOne({ id: latestBlockhash });

  if (!dbBlockDetail) {
    await Block.create(blockDetails);
    return "Created new tip Block";
  } else {
    // Update all fields except for _id
    const { _id, ...updateFields } = blockDetails;

    // Compare tx_count as in the original version
    if (dbBlockDetail.tx_count !== blockDetails.tx_count) {
      await Block.updateOne({ _id: dbBlockDetail._id }, { $set: updateFields });
      return "Updated existing tip Block";
    } else {
      return "Latest Block already in DB";
    }
  }
}

// Function to verify the previous blockhash
async function verifyPreviousBlockhash(blockhash: string): Promise<void> {
  const currentBlockDetail = await Block.findOne({ id: blockhash });
  if (!currentBlockDetail.previousblockhash) {
    console.warn("No previous block hash found in db.");
    return;
  }
  const previousBlockhash = currentBlockDetail.previousblockhash;

  const previousBlockDetail = await Block.findOne({ id: previousBlockhash });

  if (!previousBlockDetail) {
    console.warn(
      `No block details found for previous block hash ${previousBlockhash}`
    );
    return;
  }

  const txCount = await Tx.countDocuments({
    blockhash: new ObjectId(previousBlockDetail._id),
  });

  if (txCount !== previousBlockDetail.tx_count) {
    console.log({ inDb: txCount, total: previousBlockDetail.tx_count });
    console.log("Transaction count mismatch, updating...");
    await addBlockTxToDB(previousBlockhash);
  } else {
    console.log("Transaction count verified, no need for update.");
  }
}

// Add Transactions to Database

async function addBlockTxToDB(blockhash: string) {
  const dbBlockDetail = await Block.findOne({ id: blockhash });
  const bulkOps: Array<any> = [];
  const newTxIds: string[] = [];
  const inscriptionTxIds: { txid: string; inscriptions: any }[] = [];
  const bulkOpsInscription: Array<any> = [];

  const blockTxsResponse = await axios.get(
    `https://mempool.space/api/block/${blockhash}/txs`
  );
  const blockTxsData: MempoolBlockTx[] = blockTxsResponse.data;

  const existingTxIds = await Tx.find(
    { parsed: true, blockhash: new ObjectId(dbBlockDetail._id) },
    "txid"
  );

  const existingTxIdSet = new Set(existingTxIds.map((tx) => tx.txid));

  console.log({
    confirmedTxInLatestBlock: blockTxsData.length,
    totalTxInLatestBlock: dbBlockDetail.tx_count,
    existingTxOfThisBlockInDB: existingTxIds.length,
  });

  for (const item of blockTxsData) {
    const { vin: inputs, vout: outputs, txid } = item;

    if (existingTxIdSet.has(txid)) continue;

    // console.log("checking... ", txid);
    if (outputs.length >= 4 && inputs.length >= 3) {
      const inscriptions = await fetchInscriptions(`${txid}:1`);

      if (inscriptions && inscriptions.length) {
        const txData = constructTxData(inscriptions, inputs, outputs);

        bulkOps.push({
          insertOne: {
            document: {
              ...txData,
              txid,
              blockhash: new ObjectId(dbBlockDetail._id),
              tag: "sale",
              parsed: true,
            },
          },
        });

        inscriptionTxIds.push({
          txid,
          inscriptions,
        });
      } else {
        bulkOps.push({
          insertOne: {
            document: {
              txid,
              blockhash: new ObjectId(dbBlockDetail._id),
              parsed: true,
            },
          },
        });
      }
    } else {
      bulkOps.push({
        insertOne: {
          document: {
            txid,
            blockhash: new ObjectId(dbBlockDetail._id),
            parsed: true,
          },
        },
      });

      newTxIds.push(txid);
    }
  }

  if (bulkOps.length > 0) {
    await Tx.bulkWrite(bulkOps, { ordered: false });
  }

  for (const { txid, inscriptions } of inscriptionTxIds) {
    for (const inscriptionId of inscriptions) {
      const inscriptionDetails = await fetchInscriptionDetails(inscriptionId);
      const { address, location, offset, output, output_value } =
        inscriptionDetails;

      // Update Inscription Collection
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
    }
  }

  if (bulkOpsInscription.length > 0) {
    await Inscription.bulkWrite(bulkOpsInscription, { ordered: false });
  }

  return { newTxIds, inscriptionTxIds };
}

async function getPreviousBlockhash(
  currentBlockHash: string
): Promise<string | null> {
  try {
    const url = `https://mempool.space/api/block/${currentBlockHash}`;
    const response = await axios.get(url);

    if (
      response.status === 200 &&
      response.data &&
      response.data.previousblockhash
    ) {
      return response.data.previousblockhash;
    }

    return null;
  } catch (error) {
    console.error(`Error fetching previous block hash: ${error}`);
    return null;
  }
}

async function getLatestBlockHeight(): Promise<number> {
  const response = await axios.get(
    "https://mempool.space/api/blocks/tip/height"
  );
  return response.data;
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

    let latestBlockHeight: number;
    let lastSavedBlockHeight: number;

    try {
      latestBlockHeight = await getLatestBlockHeight();
      const lastSavedBlock = await Block.findOne().sort({ height: -1 });
      lastSavedBlockHeight = lastSavedBlock
        ? lastSavedBlock.height
        : latestBlockHeight;
    } catch (e) {
      console.error("Failed to get block information:", e);
      return NextResponse.json(
        { message: "Failed to get initial block height" },
        { status: 500 }
      );
    }

    if (latestBlockHeight >= lastSavedBlockHeight) {
      for (
        let currentHeight =
          latestBlockHeight === lastSavedBlockHeight
            ? latestBlockHeight
            : lastSavedBlockHeight + 1;
        currentHeight <= latestBlockHeight;
        currentHeight += 1
      ) {
        console.log("processing height: ", currentHeight);
        if (
          currentHeight > lastSavedBlockHeight + 1 ||
          currentHeight > latestBlockHeight
        ) {
          return NextResponse.json({
            message: `Sync completed from height ${lastSavedBlockHeight} to ${currentHeight}`,
          });
        }

        const currentBlockHash = await fetchBlockhashFromHeight(currentHeight);
        const operationMessage = await upsertBlockData(currentBlockHash);

        // Verify the previous blockhash
        await verifyPreviousBlockhash(currentBlockHash);

        // Add transactions for the current block to the database
        await addBlockTxToDB(currentBlockHash);

        // Fetch the previous block hash. This could be based on your database or an external service
        const previousBlockHash = await getPreviousBlockhash(currentBlockHash); // Implement this function
        if (!previousBlockHash) {
          return NextResponse.json({
            message: `Sync completed from height ${lastSavedBlockHeight} to ${currentHeight}`,
          });
          break; // Exit loop if no previous block
        }
      }
    }
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

// New GET function for a single block height
export async function POST(req: NextRequest, res: NextResponse) {
  await dbConnect();

  try {
    const blockHeight = 812096;

    if (isNaN(blockHeight)) {
      return NextResponse.json(
        { message: "Invalid block height provided" },
        { status: 400 }
      );
    }

    // Fetch blockhash from the requested block height
    const blockHash = await fetchBlockhashFromHeight(blockHeight);

    // Perform upsert operation for this block data
    const operationMessage = await upsertBlockData(blockHash);

    // Verify the previous blockhash
    await verifyPreviousBlockhash(blockHash);

    // Add transactions for this block to the database
    await addBlockTxToDB(blockHash);

    return NextResponse.json({
      message: `Sync completed for block height ${blockHeight}`,
      operationMessage,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error fetching and saving txids for the block height" },
      { status: 500 }
    );
  }
}
