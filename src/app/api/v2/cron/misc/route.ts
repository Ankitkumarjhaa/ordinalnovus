import dbConnect from "@/lib/dbConnect";
import { Inscription } from "@/models";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  await dbConnect();
  const twentyFourHoursAgo = new Date(
    new Date().getTime() - 24 * 60 * 60 * 1000
  );

  const twentyMinutesAgo = new Date(new Date().getTime() - 20 * 60 * 1000);

  const inscriptions = await Inscription.find({
    valid: false,
    updated_at: { $gte: twentyMinutesAgo },
  }).lean();

  // Find the inscriptions that match your criteria

  if (!inscriptions.length) {
    return NextResponse.json({ message: "All  processed" });
  }

  const bulkOps = [];

  for (const token of inscriptions) {
    if (token) {
      bulkOps.push({
        updateOne: {
          filter: { _id: token._id },
          update: {
            $set: { valid: true },
          },
        },
      });
    }
  }

  if (bulkOps.length > 0) {
    await Inscription.bulkWrite(bulkOps);
  }
  return NextResponse.json({
    processed: inscriptions.length,
    inscriptions,
  });
}
export const dynamic = "force-dynamic";
