import dbConnect from "@/lib/dbConnect";
import { CBRCToken, Inscription, Sale, Tx } from "@/models";
import { domain_format_validator, stringToHex } from "@/utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  await dbConnect();

  const tokens = await CBRCToken.find({}).limit(500).lean();

  // Find the tokens that match your criteria

  if (!tokens.length) {
    return NextResponse.json({ message: "All domains processed" });
  }

  const bulkOps = [];

  for (const token of tokens) {
    const fp = await Inscription.findOne({
      listed_token: token.tick.trim().toLowerCase(),
      listed: true,
      in_mempool: false,
    }).sort({ listed_price_per_token: 1 });

    const price = fp ? fp.listed_price_per_token : 0;

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
          filter: { _id: token._id }, // Assuming _id is the identifier
          update: {
            $set: {
              price,
              volume: volumeInSats,
              allowed: allowed.includes(token.checksum),
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
const allowed = [
  "626f7264",
  "6a756e6b",
  "63627263",
  "66726f67",
  "79756b69",
  "73796d6d",
  "246f7264",
  "6f726469",
  "6d6f746f",
  "626f626f",
  "6672656e",
  "31393834",
  "6e616b61",
  "636c7472",
  "68756d70",
  "686f646c",
  "776f6f66",
  "6379626f",
  "70726179",
  "6e6f6465",
  "65726c79",
  "6d617869",
  "626f7267",
  "73617473",
  "6f736869",
  "6f737079",
  "6379626f",
  "39393939",
  "70696e6f",
  "64617461",
  "63756265",
  "70657065",
  "6467656e",
];

// const resetInscription = async () => {
//   try {
//     // Update collections where supply is less than 1
//     const result = await Inscription.updateMany(
//       { domain_valid: true }, // Query filter
//       {
//         flagged: true,
//         domain_valid: false,
//       }
//     );

//     console.debug(
//       `Successfully reset inscription. Updated count: ${result.modifiedCount}`
//     );
//   } catch (error) {
//     console.error("Error resetting inscription:", error);
//   }
// };

export const dynamic = "force-dynamic";
