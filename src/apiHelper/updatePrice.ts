"use server";

import dbConnect from "@/lib/dbConnect";
import { CBRCToken, Inscription, Tx } from "@/models";
import { getBTCPriceInDollars, stringToHex } from "@/utils";

// price in $
async function updateTokenPrice(tick: string, action: string, _price?: number) {
  if (!tick) {
    throw new Error("Invalid parameters");
  }

  try {
    await dbConnect();
    const tokenLower = tick.trim().toLowerCase();

    const token = await CBRCToken.findOne({ tick: tick.trim().toLowerCase() });

    const fp = await Inscription.findOne({
      listed_token: tick.trim().toLowerCase(),
      listed: true,
      in_mempool: false,
    }).sort({ listed_price_per_token: 1 });

    const price = fp.listed_price_per_token;
    const inMempoolCount = await Inscription.countDocuments({
      listed_token: tokenLower,
      in_mempool: true,
      listed: true,
    });

    // Get 24 hours Sales volume
    const endOfDay = new Date(); // Current time
    const startOfDay = new Date();
    startOfDay.setTime(endOfDay.getTime() - 24 * 60 * 60 * 1000); // 24 hours back from now

    const todaysVolume = await Tx.aggregate([
      {
        $match: {
          token: tokenLower,
          timestamp: { $gte: startOfDay, $lte: endOfDay },
          marketplace: "ordinalnovus",
        },
      },
      {
        $group: {
          _id: null,
          totalVolume: {
            $sum: { $multiply: ["$amount", "$price_per_token"] },
          },
        },
      },
    ]);

    const volumeInSats =
      todaysVolume.length > 0 ? todaysVolume[0].totalVolume : 0;

    const result = await CBRCToken.updateOne(
      { checksum: stringToHex(tick) },
      {
        $set: {
          price: price, // in sats
          in_mempool: action === "buy" ? inMempoolCount + 1 : inMempoolCount,
          marketcap: price * token.supply, // in sats
          volume: volumeInSats, // in sats
        },
      }
    );

    if (result.modifiedCount === 0) {
      throw new Error("No document found or the price is already up-to-date");
    }

    return { success: true, message: "Price updated successfully", result };
  } catch (err: any) {
    console.error("Error updating token price:", err);
    return { success: false, message: err.message };
  }
}

export default updateTokenPrice;
