import dbConnect from "@/lib/dbConnect";
import { Inscription } from "@/models";
import moment from "moment";
import axios from "axios"; // Ensure axios is installed
import { NextResponse } from "next/server";
import { fetchLatestInscriptionData } from "@/utils/Marketplace";

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
        const { data } = await axios.get(
          `https://mempool-api.ordinalnovus.com/tx/${inscription.txid}`
        );

        const inscriptionDetails = await fetchLatestInscriptionData(
          inscription.inscription_id
        );

        await Inscription.updateOne(
          { _id: inscription._id },
          {
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
          }
        );
      } catch (error: any) {
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
