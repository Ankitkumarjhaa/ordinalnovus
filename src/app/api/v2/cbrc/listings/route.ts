import { NextRequest, NextResponse } from "next/server";
import { Collection, Inscription } from "@/models";
import dbConnect from "@/lib/dbConnect";
import convertParams from "@/utils/api/convertParams";

import apiKeyMiddleware from "@/middlewares/apikeyMiddleware";
import moment from "moment";
import { getCache, setCache } from "@/lib/cache";
import { processInscriptionsForCbrc } from "@/utils/serverUtils/processInscriptionsForCbrc";
const fetchInscriptions = async (query: any) => {
  return await Inscription.find({
    ...query.find,
    // in_mempool: false,
    $or: [{ valid: { $exists: false } }, { valid: true }],
  })
    .select("-signed_psbt -unsigned_psbt -content")
    .where(query.where)
    .sort(query.sort)
    .skip(query.start)
    .limit(query.limit)
    .lean()
    .exec();
};

const countInscriptions = async (query: any) => {
  return await Inscription.countDocuments(
    {
      ...query.find,
      // in_mempool: false,
      $or: [{ valid: { $exists: false } }, { valid: true }],
    },
    { limit: 100000 }
  );
};

export async function GET(req: NextRequest, res: NextResponse) {
  console.log("***** CBRC LISTINGS API CALLED *****");
  const startTime = Date.now(); // Record the start time

  try {
    let cacheKey = "";
    const middlewareResponse = await apiKeyMiddleware(
      ["inscription"],
      "read",
      []
    )(req);

    if (middlewareResponse) {
      return middlewareResponse;
    }

    const query = convertParams(Inscription, req.nextUrl);
    console.dir(query, { depth: null });

    query.find["listed"] = true;

    if (
      query.find.listed &&
      !query.find?.parsed_metaprotocol &&
      !query.find?.$and
    ) {
      query.find["$and"] = [
        {
          "parsed_metaprotocol.0": "cbrc-20", // Ensure the first element is "cbrc-20"
        },
        {
          parsed_metaprotocol: { $nin: ["mint", "deploy"] },
        },
      ];
    }
    console.log("QUERY>>>");

    console.dir(query, { depth: null });
    // Generate a unique cache key based on the query
    cacheKey = `cbrc_listing:${req.nextUrl.toString()}`;

    // Try to get cached data
    let cachedData = await getCache(cacheKey);
    if (cachedData && !process.env.NEXT_PUBLIC_URL?.includes("localhost")) {
      console.log("Responding from cache");
      return NextResponse.json(JSON.parse(cachedData));
    }

    await dbConnect();
    const collection = await Collection.findOne({
      slug: req.nextUrl.searchParams.get("tick"),
      metaprotocol: "cbrc",
    }).select("-holders");

    const inscriptions = await fetchInscriptions(query);

    const processedIns = await processInscriptionsForCbrc(
      inscriptions,
      collection
    );

    const totalCount = await countInscriptions(query);
    const endTime = Date.now(); // Record the end time
    const timeTaken = endTime - startTime; // Calculate the elapsed time
    console.debug(
      "Time Taken to process this: ",
      moment.duration(timeTaken).humanize()
    );

    const responseData = {
      inscriptions: processedIns,
      pagination: {
        page: query.start / query.limit + 1,
        limit: query.limit,
        total: totalCount,
      },
      time_taken_to_process: moment.duration(timeTaken).humanize(),
      processing_time: timeTaken,
    };
    // Cache the result
    // 20s
    await setCache(cacheKey, JSON.stringify(responseData), 20);

    return NextResponse.json(responseData);
  } catch (error: any) {
    if (!error?.status) console.error("Catch Error: ", error);
    return NextResponse.json(
      { message: error.message || error || "Error fetching inscriptions" },
      { status: error.status || 500 }
    );
  }
}

export const dynamic = "force-dynamic";
