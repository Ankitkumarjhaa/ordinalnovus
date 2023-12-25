import dbConnect from "@/lib/dbConnect";
import { CBRCToken, Inscription, Tx } from "@/models";
import { getBTCPriceInDollars } from "@/utils";
import convertParams from "@/utils/api/convertParams";
import { NextRequest, NextResponse } from "next/server";
const countTokens = async (query: any) => {
  return await CBRCToken.countDocuments({ ...query.find }, { limit: 100000 });
};
export async function GET(req: NextRequest) {
  try {
    const query = convertParams(CBRCToken, req.nextUrl);

    console.log({ finalQueryCbrc: query });

    await dbConnect();
    const tokens = await CBRCToken.find(query.find)
      .where(query.where)
      //@ts-ignore
      .sort(query.sort)
      .limit(query.limit)
      .skip(query.start)
      .lean()
      .exec();

    if (tokens.length === 1) {
      const tokenLower = tokens[0].tick.trim().toLowerCase();
      // Get InMempool Transactions Count
      const inMempoolCount = await Inscription.countDocuments({
        listed_token: tokenLower,
        in_mempool: true,
      });

      tokens[0].in_mempool = inMempoolCount;

      // Get Listed Count
      const listedCount = await Inscription.countDocuments({
        listed_token: tokenLower,
        listed: true,
      });
      tokens[0].listed = listedCount;

      // Get Today's Sales
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const todaysVolume = await Tx.aggregate([
        {
          $match: {
            token: tokenLower,
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

      tokens[0].volume =
        (volumeInSats / 100_000_000) * (await getBTCPriceInDollars());
    }

    const totalCount = await countTokens(query);
    return NextResponse.json({
      tokens,
      pagination: {
        page: query.start / query.limit + 1,
        limit: query.limit,
        total: totalCount,
      },
    });
  } catch (err) {
    console.error(err); // or use a more advanced error logging mechanism
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}
