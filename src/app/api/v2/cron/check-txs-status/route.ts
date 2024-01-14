import dbConnect from "@/lib/dbConnect";
import { Inscription } from "@/models";
import moment from "moment";
import { NextResponse } from "next/server";
import { fetchLatestInscriptionData } from "@/utils/Marketplace";

export async function GET() {
  try {
    await dbConnect();

    const twoDaysAgo = moment().subtract(2, "days").startOf("day").toDate();

    const query = {
      listed: true,
      in_mempool: true,
      listed_at: { $lt: twoDaysAgo },
    };

    // const query = {
    //   inscription_id:
    //     "9747fac58b0531b8fe312eab3792006e01189ac991a5d5889fd1014b127a4f9ai0",
    // };

    console.dir(query, { depth: null });

    const inMempoolForMoreThanADayTx = await Inscription.find(query);

    if (!inMempoolForMoreThanADayTx) {
      return NextResponse.json({
        message: "All items processed",
      });
    }

    console.log(
      "received in mempool items...",
      inMempoolForMoreThanADayTx.length
    );

    const bulkOps = inMempoolForMoreThanADayTx.map(async (inscription) => {
      try {
        console.log("fetching inscription details...");
        const inscriptionDetails = await fetchLatestInscriptionData(
          inscription.inscription_id
        );

        return {
          updateOne: {
            filter: { _id: inscription._id },
            update: {
              $set: {
                ...inscriptionDetails,
                listed: false,
                listed_price: 0,
                in_mempool: false,
                signed_psbt: "",
                unsigned_psbt: "",
                listed_token: "",
                listed_price_per_token: "",
                listed_amount: "",
                tap_internal_key: "",
                listed_seller_receive_address: "",
              },
            },
          },
        };
      } catch (error) {
        console.error(
          `Error fetching status for txid ${inscription.txid}:`,
          error
        );
      }
    });

    // Execute the bulk operation
    return Promise.all(bulkOps).then((operations: any) => {
      return Inscription.bulkWrite(operations.filter((op: any) => op != null));
    });
  } catch (err: any) {
    console.error("Error fetching data:", err.message);
    return NextResponse.json({ error: err.message });
  }
}

export const dynamic = "force-dynamic";
