import dbConnect from "@/lib/dbConnect";
import { CBRCStats } from "@/models";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  await dbConnect();

  try {
    // Fetch the latest stats data
    const latestStats = await CBRCStats.findOne()
      .sort({ createdAt: -1 })
      .populate("tokensTrend")
      .populate("tokensHot")
      .lean();

    if (!latestStats) {
      return NextResponse.json(
        { message: "No stats data available" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Stats data retrieved successfully",
      data: latestStats,
    });
  } catch (error) {
    console.error("Error fetching stats data:", error);
    return NextResponse.json({ message: "Error occurred" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
