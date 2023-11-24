import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import dbConnect from "@/lib/dbConnect";
import { Block, Tx, Inscription } from "@/models";
import { IVIN, IVOUT, MempoolBlockTx } from "@/types/Tx";
import { ObjectId } from "mongodb";
import moment from "moment";

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
async function verifyPreviousBlockhash(blockhash: string): Promise<boolean> {
  const currentBlockDetail = await Block.findOne({ id: blockhash });
  if (!currentBlockDetail.previousblockhash) {
    console.warn("No previous block hash found in db.");
    return false;
  }
  const previousBlockhash = currentBlockDetail.previousblockhash;

  const previousBlockDetail = await Block.findOne({ id: previousBlockhash });

  if (!previousBlockDetail) {
    console.warn(
      `No block details found for previous block hash ${previousBlockhash}`
    );
    return false;
  }

  const txCount = await Tx.countDocuments({
    blockhash: new ObjectId(previousBlockDetail._id),
  });

  if (txCount !== previousBlockDetail.tx_count) {
    console.log({
      inDb: txCount,
      total: previousBlockDetail.tx_count,
      previousBlockhash,
    });
    console.log("Transaction count mismatch, updating...");
    await addBlockTxToDB(previousBlockhash);
    return true;
  } else {
    console.log("Transaction count verified, no need for update.");
    return false;
  }
}

// Add Transactions to Database

const fetchTransactions = async (index: number, blockhash: string) => {
  try {
    console.log({ index, blockhash });
    const response = await axios.get(
      `https://mempool.space/api/block/${blockhash}/txs/${index}`
    );
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      return []; // Return empty array for 404 errors
    } else if (error.response && error.response.status === 400) {
      // throw Error("wrong number of tx in DB");
    } else {
      throw error; // Re-throw other errors
    }
  }
};

async function addBlockTxToDB(blockhash: string) {
  await dbConnect();
  const dbBlockDetail = await Block.findOne({ id: blockhash });
  console.log(dbBlockDetail, "DB To process");
  const bulkOps: Array<any> = [];
  const newTxIds: string[] = [];
  const inscriptionTxIds: { txid: string; inscriptions: any }[] = [];

  let existingTxIds = [];
  let existingTxIdSet = null;
  if (dbBlockDetail) {
    existingTxIds = await Tx.find(
      { blockhash: new ObjectId(dbBlockDetail._id) },
      "txid"
    );
    existingTxIdSet = new Set(existingTxIds.map((tx) => tx.txid));
  }

  if (dbBlockDetail.tx_count === existingTxIds.length) {
    dbBlockDetail.processed = true;
    dbBlockDetail.save();
    return { newTxIds, inscriptionTxIds };
  }

  let startIndex = existingTxIds.length;
  if (startIndex % 25 !== 0) {
    await Tx.deleteMany({ blockhash: new ObjectId(dbBlockDetail._id) });
    throw Error("wrong number of tx in DB");
  }
  let allBlockTxsData: any = [];
  const maxTransactions = 100;
  const batchSize = 25; // Each call handles 25 transactions
  const parallelCalls = 10; // Total 4 API calls
  const promises = [];
  for (let i = 0; i < parallelCalls; i++) {
    promises.push(fetchTransactions(startIndex, blockhash));
    startIndex += batchSize;
  }

  // console.log({ promises });

  const results = await Promise.all(promises);
  for (const blockTxsData of results) {
    if (blockTxsData.length === 0) {
      startIndex = maxTransactions; // Break out of the loop
      break;
    }
    allBlockTxsData = allBlockTxsData.concat(blockTxsData);
  }

  // console.log({ results }, "RES");

  console.log({
    txsSentByMempool: allBlockTxsData.length,
    txMempoolShouldBe: dbBlockDetail.tx_count,
    existingTxInDB: existingTxIds.length,
  });

  for (const item of allBlockTxsData) {
    const {
      vin: inputs,
      vout: outputs,
      txid,
      version,
      size,
      weight,
      fee,
      status,
    } = item;

    if (existingTxIdSet && existingTxIdSet.has(txid)) continue;

    newTxIds.push(txid);

    bulkOps.push({
      insertOne: {
        document: {
          txid,
          blockhash: new ObjectId(dbBlockDetail._id),
          parsed: false,
          version,
          size,
          weight,
          fee,
          status: "confirmed",
          vin: inputs,
          vout: outputs,
          height: dbBlockDetail.height,
        },
      },
    });
  }

  if (bulkOps.length > 0) {
    console.log(bulkOps.length, " tx are being added");
    await Tx.bulkWrite(bulkOps);
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
    let latestBlockHeight: number;
    let lastSavedBlockHeight: number;

    try {
      latestBlockHeight = await getLatestBlockHeight();
      let lastSavedBlock = await Block.findOne({ processed: false }).sort({
        height: -1,
      });

      if (!lastSavedBlock) {
        lastSavedBlock = await Block.findOne({}).sort({
          height: -1,
        });
      }
      lastSavedBlockHeight = lastSavedBlock
        ? lastSavedBlock.processed
          ? lastSavedBlock.height + 1
          : lastSavedBlock.height
        : latestBlockHeight;

      console.log({ lastSavedBlockHeight });

      // If the latest block height is the same as the last saved block height, process it
      if (lastSavedBlockHeight) {
        console.log("Processing block at height: ", lastSavedBlockHeight);
        await processBlockHeight(lastSavedBlockHeight);
      } else {
        console.log(
          "No new blocks to process. Latest block height is already saved."
        );
      }
    } catch (e: any) {
      console.error("Failed to get block information:", e);
      return NextResponse.json({ message: e.message || e }, { status: 500 });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error fetching and saving txids" },
      { status: 500 }
    );
  }
}

async function processBlockHeight(blockHeight: number) {
  const currentBlockHash = await fetchBlockhashFromHeight(blockHeight);
  const operationMessage = await upsertBlockData(currentBlockHash);

  // Verify the previous blockhash
  // await verifyPreviousBlockhash(currentBlockHash);

  // Add transactions for the current block to the database
  await addBlockTxToDB(currentBlockHash);

  // Fetch the previous block hash. This could be based on your database or an external service
  // const previousBlockHash = await getPreviousBlockhash(currentBlockHash);
  // if (!previousBlockHash) {
  //   console.log(`Sync completed for block height ${blockHeight}`);
  // }
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
    const updatingPrevious = await verifyPreviousBlockhash(blockHash);

    // Add transactions for this block to the database
    if (!updatingPrevious) await addBlockTxToDB(blockHash);
    else {
      console.log("not adding new blockhash items as older one was updated");
    }

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

export const dynamic = "force-dynamic";
