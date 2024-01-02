import { NextRequest, NextResponse } from "next/server";
import { Inscribe } from "@/models";
import dbConnect from "@/lib/dbConnect";
import convertParams from "@/utils/api/convertParams";
import { setCache, getCache } from "@/lib/cache";
import apiKeyMiddleware from "@/middlewares/apikeyMiddleware";
import moment from "moment";

const fetchOrders = async (query: any) => {
  return await Inscribe.find(query.find)
    .select("-privkey")
    .where(query.where)
    .sort(query.sort)
    .skip(query.start)
    .limit(query.limit)
    .lean()
    .exec();
};

const countOrders = async (query: any) => {
  return await Inscribe.countDocuments({ ...query.find }, { limit: 100000 });
};

export async function GET(req: NextRequest, res: NextResponse) {
  console.log("***** ORDER API CALLED *****");
  try {
    const middlewareResponse = await apiKeyMiddleware(
      ["inscription"],
      "read",
      []
    )(req);

    if (middlewareResponse) {
      return middlewareResponse;
    }

    const query = convertParams(Inscribe, req.nextUrl);
    console.dir(query, { depth: null });
    // Generate a unique cache key based on the query
    const cacheKey = `inscribeOrder:${JSON.stringify(query)}`;

    await dbConnect();
    const orders = await fetchOrders(query);

    const totalCount = await countOrders(query);
    // Cache the result
    const responseData = {
      orders,
      pagination: {
        page: query.start / query.limit + 1,
        limit: query.limit,
        total: totalCount,
      },
    };
    await setCache(cacheKey, JSON.stringify(responseData), 10 * 60);

    return NextResponse.json(responseData);
  } catch (error: any) {
    if (!error?.status) console.error("Catch Error: ", error);
    return NextResponse.json(
      { message: error.message || error || "Error fetching orders" },
      { status: error.status || 500 }
    );
  }
}

export const dynamic = "force-dynamic";
