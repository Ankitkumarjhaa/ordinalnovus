import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import dbConnect from "@/lib/dbConnect";
import { Block, Tx } from "@/models";
import { ObjectId } from "mongodb";
import { sendEmailAlert } from "@/utils/sendEmailAlert";
import { getCache, setCache } from "@/lib/cache";

async function fetchBlockhashFromHeight(height: number): Promise<string> {
  try {
    const tipResponse = await axios.get(
      `https://mempool-api.ordinalnovus.com/block-height/${height}`
    );
    return tipResponse.data;
  } catch (error: any) {
    if (
      axios.isAxiosError(error) &&
      error.response &&
      error.response.status === 404
    ) {
      // If block not found, set a cache entry to halt processing for 5 minutes (300 seconds)
      await setCache("haltProcessing", true, 300);
      throw new Error(
        "Block not found. Latest data already in DB. Processing halted for 5 minutes."
      );
    } else {
      throw error;
    }
  }
}

async function fetchBlockDetails(latestBlockhash: string): Promise<any> {
  const blockDetailsResponse = await axios.get(
    `https://mempool-api.ordinalnovus.com/block/${latestBlockhash}`
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
    console.debug("Transaction count mismatch, updating...");
    await addBlockTxToDB(previousBlockhash);
    return true;
  } else {
    console.debug("Transaction count verified, no need for update.");
    return false;
  }
}

// Add Transactions to Database

const fetchTransactions = async (index: number, blockhash: string) => {
  try {
    console.debug({ index });
    const response = await axios.get(
      `https://mempool-api.ordinalnovus.com/block/${blockhash}/txs/${index}`
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
  const parallelCalls = 20; // Total 4 API calls
  const promises = [];
  for (let i = 0; i < parallelCalls; i++) {
    promises.push(fetchTransactions(startIndex, blockhash));
    startIndex += batchSize;
  }

  const results = await Promise.all(promises);
  for (const blockTxsData of results) {
    if (blockTxsData.length === 0) {
      startIndex = maxTransactions; // Break out of the loop
      break;
    }
    allBlockTxsData = allBlockTxsData.concat(blockTxsData);
  }

  console.debug({
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
          timestamp: new Date(item.status.block_time * 1000),
        },
      },
    });
  }

  if (newTxIds.length > 0) {
    await Tx.deleteMany({ txid: { $in: newTxIds } });
  }

  if (bulkOps.length > 0) {
    console.debug(bulkOps.length, " tx are being added");
    await Tx.bulkWrite(bulkOps);
  }

  return { newTxIds, inscriptionTxIds };
}

async function getLatestBlockHeight(): Promise<number> {
  const response = await axios.get(
    "https://mempool-api.ordinalnovus.com/blocks/tip/height"
  );
  return response.data;
}

// API Handler
export async function GET(req: NextRequest, res: NextResponse) {
  try {
    // Check if a 'halt processing' cache entry exists
    const haltProcessing = await getCache("haltProcessing");
    if (haltProcessing) {
      return NextResponse.json({ message: "All Blocks already processed" });
    }
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

      if (latestBlockHeight - lastSavedBlock.height > 5) {
        const cacheKey = "blockProcessingAlert";
        const cache = await getCache(cacheKey);
        if (!cache) {
          try {
            await sendEmailAlert({
              subject: "Block Processing Stopped",
              html: `<h1>Ordinalnovus Email Alert</h1><br/>
              <p>Block Processing Has Stopped<p><br/>
              <p>Last Processed Block: ${lastSavedBlock.height}</p><br/>
              <p>Latest Block Height: ${latestBlockHeight}</p></br/>
              <p>Difference: ${
                latestBlockHeight - lastSavedBlock.height
              } Blocks to process</p>`,
            });

            setCache(cacheKey, { emailSent: true }, 2 * 60 * 60);
          } catch {}
        }
      }
      lastSavedBlockHeight = lastSavedBlock
        ? lastSavedBlock.processed
          ? lastSavedBlock.height + 1
          : lastSavedBlock.height
        : latestBlockHeight;

      // If the latest block height is the same as the last saved block height, process it
      if (lastSavedBlockHeight) {
        console.debug("Processing block at height: ", lastSavedBlockHeight);
        await processBlockHeight(lastSavedBlockHeight);
      } else {
        console.debug(
          "No new blocks to process. Latest block height is already saved."
        );
      }
    } catch (e: any) {
      console.error("Failed to get block information:", e);
      return NextResponse.json(
        { message: e.response.error.message || e },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error fetching and saving txids" },
      { status: 500 }
    );
  } finally {
    return NextResponse.json({ message: "Success" }, { status: 200 });
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
  //   console.debug(`Sync completed for block height ${blockHeight}`);
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
      console.debug("not adding new blockhash items as older one was updated");
    }

    return NextResponse.json({
      message: `Sync completed for block height ${blockHeight}`,
      operationMessage,
    });
  } catch (error: any) {
    console.error(error.response.data.message || error.message || error);
    return NextResponse.json(
      { message: "Error fetching and saving txids for the block height" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
