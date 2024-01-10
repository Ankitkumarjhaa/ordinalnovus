import dbConnect from "@/lib/dbConnect";
import { CBRCToken, Inscription, Sale, Tx } from "@/models";
import { getBTCPriceInDollars } from "@/utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  await dbConnect();

  const startDate = new Date("2023-12-17");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // const twentyMinutesAgo = new Date();
  // twentyMinutesAgo.setMinutes(twentyMinutesAgo.getMinutes() - 20);

  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24); // Subtract 24 hours from the current time

  const tokens = await CBRCToken.find({
    $or: [
      { last_updated: { $lte: twentyFourHoursAgo } }, // Tokens updated 24 hours ago or earlier
      { last_updated: { $exists: false } }, // Tokens without a lastUpdated field
    ],
    allowed: true,
  })
    .limit(10)
    .lean();

  if (!tokens.length) {
    return NextResponse.json({ message: "All tokens are up-to-date" });
  }

  const btcPrice = await getBTCPriceInDollars();

  const bulkOps: any = [];

  for (const token of tokens) {
    if (!token.tick || typeof token.supply !== "number") {
      // Handle missing or invalid token data
      continue;
    }
    let currentDate: number | Date;

    // Check if historicalData exists and has at least one entry
    if (token.historicalData && token.historicalData.length > 0) {
      // Sort the historicalData in descending order (latest date first)
      token.historicalData.sort(
        (a: any, b: any) => new Date(b.date) - new Date(a.date)
      );

      // Set currentDate to the day after the latest entry in historicalData
      currentDate = new Date(token.historicalData[0].date);
      currentDate.setDate(currentDate.getDate() + 1);
    } else {
      // If no historicalData, start from the startDate
      currentDate = new Date(startDate);
    }

    if (isNaN(currentDate.getTime())) {
      currentDate = new Date(startDate);
    }

    // Find the latest sale transaction for the token
    const latestSale = await Tx.findOne({
      token: token.tick.trim().toLowerCase(),
      tag: "sale",
      // marketplace: "ordinalnovus",
    }).sort({ timestamp: -1 });

    // Floor Price
    const fp = await Inscription.findOne({
      listed_token: token.tick.trim().toLowerCase(),
      listed: true,
      in_mempool: false,
    }).sort({ listed_price_per_token: 1 });

    const price = fp ? fp?.listed_price_per_token : latestSale?.price_per_token;
    const inMempoolCount = await Inscription.countDocuments({
      listed_token: token.tick.trim().toLowerCase(),
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
          token: token.tick.trim().toLowerCase(),
          timestamp: { $gte: startOfDay, $lte: endOfDay },
          // marketplace: "ordinalnovus",
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

    while (currentDate < today) {
      console.log({ currentDate });
      // Check if the currentDate already exists in historicalData
      const dateExists =
        token.historicalData &&
        token.historicalData.some((data: { date: string | number | Date }) => {
          const existingDate = new Date(data.date);
          return existingDate.setHours(0, 0, 0, 0) === currentDate.getTime();
        });
      console.log("fetching market data: ", {
        tick: token.tick,
        supply: token.supply,
      });

      if (!dateExists) {
        const marketData = await fetchMarketDataForDate(
          token.tick,
          currentDate,
          token.supply
        );

        if (marketData && marketData.price !== undefined && btcPrice) {
          bulkOps.push({
            updateOne: {
              filter: { _id: token._id },
              update: {
                price,
                volume: volumeInSats,
                in_mempool: inMempoolCount,
                last_updated: new Date(),
                // ...(latestSale &&
                //   latestSale.price_per_token && {
                //     price: latestSale.price_per_token,
                //   }),
                $push: {
                  historicalData: {
                    $each: [
                      {
                        date: marketData.date,
                        price: (marketData.price / 100_000_000) * btcPrice,
                        volume: (marketData.volume / 100_000_000) * btcPrice,
                        volume_sats: marketData.volume,
                        on_volume:
                          (marketData.on_volume / 100_000_000) * btcPrice,
                        on_volume_sats: marketData.on_volume,
                        marketCap:
                          (marketData.marketCap / 100_000_000) * btcPrice,
                      },
                    ],
                    $position: 0,
                  },
                },
              },
            },
          });
        } else {
          bulkOps.push({
            updateOne: {
              filter: { _id: token._id },
              update: {
                // ...(latestSale &&
                //   latestSale.price_per_token && {
                //     price:
                //       (latestSale.price_per_token / 100_000_000) * btcPrice,
                //   }),
                price,
                volume: volumeInSats,
                in_mempool: inMempoolCount,
                last_updated: new Date(),
              },
            },
          });
        }
      }

      currentDate.setDate(currentDate.getDate() + 1); // Move to the next date
    }
  }

  if (bulkOps.length > 0) {
    await CBRCToken.bulkWrite(bulkOps);
  }

  return NextResponse.json({
    message: "Historical data updated",
    processed: tokens.length,
    tokens,
  });
}

async function fetchMarketDataForDate(
  tokenTick: string,
  date: Date,
  supply: number
) {
  // Setting up start and end of the day for the given date
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const pipeline = [
    {
      $match: {
        timestamp: { $gte: startOfDay, $lte: endOfDay },
        token: tokenTick.trim().toLowerCase(), // Assuming 'token' field matches the token tick
        tag: "sale", // Filter transactions tagged as 'sale'
      },
    },
    {
      $group: {
        _id: null,
        totalVolume: { $sum: "$price" }, // Sum of all transaction amounts
        onVolume: {
          $sum: {
            $cond: [{ $eq: ["$marketplace", "ordinalnovus"] }, "$price", 0],
          },
        },
        averagePrice: { $avg: "$price_per_token" }, // Average price of the token
      },
    },
  ];
  // console.dir(pipeline, { depth: null });
  // Aggregate query to calculate total volume, on_volume, and average price
  const aggregateData = await Tx.aggregate(pipeline);

  if (aggregateData.length === 0) {
    return null; // No data found for the given date
  }

  const data = aggregateData[0];
  // Calculating market cap: price * total supply (assuming total supply is available)
  const marketCap = data.averagePrice * supply;

  return {
    price: data.averagePrice || 0,
    volume: data.totalVolume || 0,
    on_volume: data.onVolume || 0,
    marketCap: marketCap || 0,
    date: endOfDay,
  };
}

export const dynamic = "force-dynamic";
