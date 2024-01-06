import dbConnect from "@/lib/dbConnect";
import { Block, CBRCToken, Stats, Tx } from "@/models";

import { NextRequest, NextResponse } from "next/server";

import moment from "moment";

import axios from "axios";

export async function GET(req: NextRequest) {
  const { data } = await axios.get("https://api-prod.cybord.org/heights");
  const btcHeight = data.bitcoin;

  const { data: mempoolData } = await axios.get(
    "https://mempool-api.ordinalnovus.com/blocks/tip/height"
  );

  const mempoolBtcHeight = mempoolData;

  const novusHeightData = await Block.findOne().sort({ height: -1 }).lean();
  const novusBtcHeight = novusHeightData.height;

  await dbConnect();

  const tokens = await CBRCToken.countDocuments({
    allowed: true,
  });

  const tokensTrend = await CBRCToken.find({
    allowed: true,
  }) .sort({ updatedAt: -1 }).limit(3).lean();

  const tokensHot = await CBRCToken.find({
    allowed: true,
  }).sort({ in_mempool: -1 }).limit(3).lean();

  if (!tokens) {
    return NextResponse.json({ message: "API down" });
  }

  const statsData: {
    dailyVolume: number;
    monthlyVolume: number;
    allTimeVolume: number;
  } = await fetchMarketStats();
  console.log({ total: tokens });

  const updatedStats = await Stats.findOneAndUpdate({_id:"6597e8ca5e2234ff4fe14c76"}, {
    tokens,
    tokensTrend,
    tokensHot,
    allTimeVolume: statsData.allTimeVolume,
    dailyVolume: statsData.dailyVolume,
    monthlyVolume: statsData.monthlyVolume,
    btcHeight,
    novusBtcHeight,
    mempoolBtcHeight,
  }, { upsert: true, new: true });

console.log(updatedStats,'updatedStats')

  return NextResponse.json({
    message: "Stats Api",
  updatedStats
  });
}

async function fetchMarketStats() {
  // Setting up start and end of the day for the given date
  const now = moment(); // Current time
  const startOfDay = now.clone().startOf("day").toDate(); // Start of today
  const endOfDay = now.clone().endOf("day").toDate(); // End of today
  const twentyFourHoursAgo = now.clone().subtract(24, "hours").toDate(); // 24 hours ago
  const oneWeekAgo = now.clone().subtract(1, "weeks").toDate(); // 1 week ago
  const thirtyDaysAgo = now.clone().subtract(30, "days").toDate(); // 30 days
  // TODO: use moment to calculate timestamp for last 24 hours and last 1 week and last 30 days

  const dailyPipeline = [
    {
      $match: {
        timestamp: { $gte: twentyFourHoursAgo },
        tag: "sale",
        marketplace: "ordinalnovus", // Filter transactions tagged as 'sale'
      },
    },
    {
      $group: {
        _id: null,
        totalVolume: { $sum: "$price" }, // Sum of all transaction amounts
      },
    },
  ];

  const monthlyPipeline = [
    {
      $match: {
        timestamp: { $gte: thirtyDaysAgo },
        tag: "sale",
        marketplace: "ordinalnovus", // Filter transactions tagged as 'sale'
      },
    },
    {
      $group: {
        _id: null,
        totalVolume: { $sum: "$price" }, // Sum of all transaction amounts
      },
    },
  ];

  const allTimePipeline = [
    {
      $match: {
        tag: "sale",
        marketplace: "ordinalnovus", // Filter transactions tagged as 'sale'
      },
    },
    {
      $group: {
        _id: null,
        totalVolume: { $sum: "$price" }, // Sum of all transaction amounts
      },
    },
  ];

  // console.dir(pipeline, { depth: null });
  // Aggregate query to calculate total volume, on_volume, and average price
  const aggregateDailyData = await Tx.aggregate(dailyPipeline);

  const aggregateMonthlyData = await Tx.aggregate(monthlyPipeline);

  const aggregateAllTimeData = await Tx.aggregate(allTimePipeline);

  const dailyData = aggregateDailyData.length
    ? aggregateDailyData[0]
    : { totalVolume: 0 };
  const monthlyData = aggregateMonthlyData.length
    ? aggregateMonthlyData[0]
    : { totalVolume: 0 };
  const allTimeData = aggregateAllTimeData.length
    ? aggregateAllTimeData[0]
    : { totalVolume: 0 };

  console.log(dailyData, "dailydata");
  console.log(monthlyData, "monthly data");
  console.log(allTimeData, "all time data");

  return {
    dailyVolume: dailyData.totalVolume,
    monthlyVolume: monthlyData.totalVolume,
    allTimeVolume: allTimeData.totalVolume,
    // cybordBtcHeight : btcHeight
  };
}

export const dynamic = "force-dynamic";
