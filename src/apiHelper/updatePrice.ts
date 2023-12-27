"use server";

import dbConnect from "@/lib/dbConnect";
import { CBRCToken, Inscription } from "@/models";
import { stringToHex } from "@/utils";

// price in $
async function updateTokenPrice(tick: string, price: number) {
  if (!tick || typeof price !== "number") {
    throw new Error("Invalid parameters");
  }

  try {
    await dbConnect();
    const tokenLower = tick.trim().toLowerCase();

    const token = await CBRCToken.findOne({ tick: tick.trim().toLowerCase() });
    const inMempoolCount = await Inscription.countDocuments({
      listed_token: tokenLower,
      in_mempool: true,
      listed: true,
    });
    const result = await CBRCToken.updateOne(
      { checksum: stringToHex(tick) },
      {
        $set: {
          price: price,
          in_mempool: inMempoolCount + 1,
          marketcap: price * token.supply,
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
