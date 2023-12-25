import dbConnect from "@/lib/dbConnect";
import { CBRCToken, Inscription, Sale } from "@/models";
import { domain_format_validator, stringToHex } from "@/utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  await dbConnect();

  const tokens = await CBRCToken.find({ price: { $exists: true } })
    .limit(50000)
    .lean();

  // Find the tokens that match your criteria

  if (!tokens.length) {
    return NextResponse.json({ message: "All domains processed" });
  }

  const bulkOps = [];

  for (const token of tokens) {
    if (token.tick) {
      bulkOps.push({
        updateOne: {
          filter: { _id: token._id }, // Assuming _id is the identifier
          update: {
            $set: {
              marketcap: token.price * token.supply,
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

const resetInscription = async () => {
  try {
    // Update collections where supply is less than 1
    const result = await Inscription.updateMany(
      { domain_valid: true }, // Query filter
      {
        flagged: true,
        domain_valid: false,
      }
    );

    console.debug(
      `Successfully reset inscription. Updated count: ${result.modifiedCount}`
    );
  } catch (error) {
    console.error("Error resetting inscription:", error);
  }
};

export const dynamic = "force-dynamic";
