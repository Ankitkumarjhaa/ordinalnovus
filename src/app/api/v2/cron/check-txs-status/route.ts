import dbConnect from "@/lib/dbConnect";
import { Inscription } from "@/models";
import moment from "moment";
import axios from "axios"; // Ensure axios is installed
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await dbConnect();

    const twoDaysAgo = moment().subtract(2, "days").startOf("day").toDate();

    const inMempoolForMoreThanADayTx = await Inscription.find({
      in_mempool: true,
      updated_at: { $lt: twoDaysAgo },
    });

    for (const inscription of inMempoolForMoreThanADayTx) {
      try {
        const response = await axios.get(
          `https://mempool.space/api/tx/${inscription.txid}/status`
        );
        await Inscription.updateOne(
          { _id: inscription._id },
          {
            $set: {
              listed: false,
              listed_price: 0,
              in_mempool: false,
              signed_psbt: "",
              unsigned_psbt: "",
              listed_token: "",
              listed_price_per_token: "",
              listed_amount: "",
            },
          }
        );
      } catch (error) {
        console.error(
          `Error fetching status for txid ${inscription.txid}:`,
          error
        );
      }
    }

    // Optionally, refetch the updated list of inscriptions
    const updatedInscriptions = await Inscription.find({
      in_mempool: true,
      updated_at: { $lt: twoDaysAgo },
    });

    return NextResponse.json({
      total: updatedInscriptions.length,
      updatedInscriptions,
    });
  } catch (err: any) {
    console.error("Error fetching data:", err.message);
    return NextResponse.json({ error: err.message });
  }
}

export const dynamic = "force-dynamic";
