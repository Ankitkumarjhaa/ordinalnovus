import dbConnect from "@/lib/dbConnect";
import { CBRCToken, Inscription, Sale, Tx } from "@/models";
import { domain_format_validator, stringToHex } from "@/utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  await dbConnect();

  const tokens = await CBRCToken.find({ checksum: { $exists: false } })
    .limit(500)
    .lean();

  // Find the tokens that match your criteria

  if (!tokens.length) {
    return NextResponse.json({ message: "All domains processed" });
  }

  const bulkOps = [];

  for (const token of tokens) {
    // const fp = await Inscription.findOne({
    //   listed_token: token.tick.trim().toLowerCase(),
    //   listed: true,
    //   in_mempool: false,
    // }).sort({ listed_price_per_token: 1 });

    // const price = fp ? fp.listed_price_per_token : 0;

    // Get Today's Sales
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    const todaysVolume = await Tx.aggregate([
      {
        $match: {
          token: token.tick,
          timestamp: { $gte: startOfDay, $lte: endOfDay },
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

    if (token) {
      bulkOps.push({
        updateOne: {
          filter: { _id: token._id },
          update: {
            $set: {
              checksum: stringToHex(token.tick.trim().toLowerCase()),
              // price,
              volume: volumeInSats,
              allowed: false,
            },
          },
        },
      });
    }
  }

  if (bulkOps.length > 0) {
    await CBRCToken.bulkWrite(bulkOps);
  }
  return NextResponse.json({
    processed: tokens.length,
    tokens,
  });
}
export const dynamic = "force-dynamic";
