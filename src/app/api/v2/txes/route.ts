import { NextRequest, NextResponse } from "next/server";
import { Tx } from "@/models";
import dbConnect from "@/lib/dbConnect";
import convertParams from "@/utils/api/convertParams";
import { setCache, getCache } from "@/lib/cache";
import apiKeyMiddleware from "@/middlewares/apikeyMiddleware";
import moment from "moment";

const fetchTxes = async (query: any) => {
  return await Tx.find(query.find)
    .select("-vin -vout")
    .where(query.where)
    .sort(query.sort)
    .skip(query.start)
    .limit(query.limit)
    .lean()
    .exec();
};

const countTransactions = async (query: any) => {
  return await Tx.countDocuments({ ...query.find }, { limit: 100000 });
};

export async function GET(req: NextRequest, res: NextResponse) {
  console.log("***** Transactions API CALLED *****");
  const startTime = Date.now(); // Record the start time

  try {
    const middlewareResponse = await apiKeyMiddleware(
      ["inscription"],
      "read",
      []
    )(req);

    if (middlewareResponse) {
      return middlewareResponse;
    }

    const query = convertParams(Tx, req.nextUrl);
    console.dir(query, { depth: null });
    // Generate a unique cache key based on the query
    const cacheKey = `txes:${JSON.stringify(query)}`;

    await dbConnect();
    const txes = await fetchTxes(query);

    const totalCount = await countTransactions(query);
    const endTime = Date.now(); // Record the end time
    const timeTaken = endTime - startTime; // Calculate the elapsed time
    console.debug(
      "Time Taken to process this: ",
      moment.duration(timeTaken).humanize()
    );

    // Cache the result
    const responseData = {
      txes,
      pagination: {
        page: query.start / query.limit + 1,
        limit: query.limit,
        total: totalCount,
      },
      time_taken_to_process: moment.duration(Date.now() - startTime).humanize(),
      processing_time: Date.now() - startTime,
    };
    await setCache(cacheKey, JSON.stringify(responseData), 10 * 60);

    return NextResponse.json(responseData);
  } catch (error: any) {
    if (!error?.status) console.error("Catch Error: ", error);
    return NextResponse.json(
      { message: error.message || error || "Error fetching txes" },
      { status: error.status || 500 }
    );
  }
}

export const dynamic = "force-dynamic";
