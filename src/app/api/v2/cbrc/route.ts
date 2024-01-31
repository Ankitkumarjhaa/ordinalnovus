import { getCache, setCache } from "@/lib/cache";
import dbConnect from "@/lib/dbConnect";
import apiKeyMiddleware from "@/middlewares/apikeyMiddleware";
import { CBRCToken, Inscription } from "@/models";
import convertParams from "@/utils/api/convertParams";
import { NextRequest, NextResponse } from "next/server";

const countTokens = async (query: any) => {
  return await CBRCToken.countDocuments({ ...query.find }, { limit: 100000 });
};
export async function GET(req: NextRequest) {
  try {
    const middlewareResponse = await apiKeyMiddleware(
      ["inscription"],
      "read",
      []
    )(req);

    if (middlewareResponse) {
      return middlewareResponse;
    }
    const query = convertParams(CBRCToken, req.nextUrl);

    // Generate a unique key for this query
    const cacheKey = `cbrc_token:${JSON.stringify(query)}`;

    console.log({ finalQueryCbrc: query });
    // Try to fetch the result from Redis first
    let cachedResult =
      process.env.NODE_ENV === "production" ? await getCache(cacheKey) : null;

    if (cachedResult) {
      console.debug("using cache");
      return NextResponse.json(cachedResult);
    }

    await dbConnect();
    const tokens = await CBRCToken.find(query.find)
      .where(query.where)
      //@ts-ignore
      .sort({ ...query.sort, marketcap: -1 })
      .collation({ locale: "en_US", numericOrdering: true })
      .limit(query.limit)
      .skip(query.start)
      .lean()
      .exec();

    if (tokens.length === 1) {
      const tempTokenInfo = tokens[0];
      const tokenLower = tokens[0].tick.trim().toLowerCase();

      // Get Listed Count
      const listedCount = await Inscription.countDocuments({
        listed_token: tokenLower,
        listed: true,
      });
      tempTokenInfo.listed = listedCount;

      // tempTokenInfo.volume =
      //   (volumeInSats / 100_000_000) * (await getBTCPriceInDollars());

      tokens[0] = tempTokenInfo;
    }

    const totalCount = await countTokens(query);
    const result = {
      tokens,
      pagination: {
        page: query.start / query.limit + 1,
        limit: query.limit,
        total: totalCount,
      },
    };

    await setCache(cacheKey, result, 30); //20 seconds
    return NextResponse.json(result);
  } catch (err) {
    console.error(err); // or use a more advanced error logging mechanism
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}
