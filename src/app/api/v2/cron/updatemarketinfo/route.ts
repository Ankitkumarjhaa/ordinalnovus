import dbConnect from "@/lib/dbConnect";
import { CBRCToken, CbrcMarketData } from "@/models";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  await dbConnect();

  const startDate = new Date("2023-12-17");
  startDate.setHours(0, 0, 0, 0);
  const token = await CBRCToken.findOne({ tick: "bord" });

  if (!token) {
    return NextResponse.json({ message: "All tokens are up-to-date" });
  }

  if (await isMarketDataOlderThan1Hour(token.tick)) {
    console.log("Needs an hourly update");
  }
  return NextResponse.json({
    message: "Historical data updated",
    processed: token,
    token,
  });
}

async function isMarketDataOlderThan1Hour(tick: string) {
  const oneHourAgo = new Date(new Date().getTime() - 60 * 60 * 1000); // 1 hour in milliseconds

  const latestData = await CbrcMarketData.findOne({ symbol: tick })
    .sort({ timestamp: -1 }) // Sort by timestamp in descending order to get the latest entry
    .exec();

  if (!latestData) {
    // No market data found for the tick
    return true;
  } else if (latestData.timestamp < oneHourAgo) {
    // Latest market data is older than 1 hour
    return true;
  } else {
    // Market data is recent
    return false;
  }
}
