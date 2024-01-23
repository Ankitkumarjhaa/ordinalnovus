import { NextRequest, NextResponse } from "next/server";
import { Inscription, Collection, SatCollection } from "@/models";
import dbConnect from "@/lib/dbConnect";
import convertParams from "@/utils/api/convertParams";

import apiKeyMiddleware from "@/middlewares/apikeyMiddleware";
import { CustomError } from "@/utils";
import moment from "moment";
import { ICollection, IInscription } from "@/types";
import { getCache, setCache } from "@/lib/cache";
import { processInscriptionsForCbrc } from "@/utils/serverUtils/processInscriptionsForCbrc";

const getProjectionFields = (show: string) => {
  if (show === "prune") {
    return "inscription_id inscription_number content_type tags token rarity timestamp sha address listed_price listed_at";
  } else if (show === "all") {
    return "-_id -__v -created_at -updated_at -signed_psbt -unsigned_psbt -tap_internal_key";
  } else {
    // Exclude sensitive fields from custom 'show' parameter
    const excludedFields = ["signed_psbt", "unsigned_psbt", "tap_internal_key"];
    let projectionFields = show
      .split(" ")
      .filter((field: string) => !excludedFields.includes(field))
      .join(" ");
    return projectionFields;
  }
};

const fetchInscriptions = async (query: any, projectionFields: string) => {
  if (query.sort["listed_price"]) {
    query.find["listed"] = true;
  }

  if (query.find.listed) {
    query.find["parsed_metaprotocol"] = { $nin: ["mint"] };
  }
  console.log("QUERY>>>");
  console.dir(query, { depth: null });

  return await Inscription.find(query.find)
    .select(projectionFields)
    .where(query.where)
    .populate({
      path: "official_collection",
      select:
        "name inscription_id inscription_icon supply slug description _id verified featured token_amount",
      populate: {
        path: "inscription_icon",
        select: "inscription_id content_type",
      },
    })
    .sort(query.sort)
    .skip(query.start)
    .limit(query.limit)
    .lean()
    .exec();
};

const countInscriptions = async (query: any) => {
  return await Inscription.countDocuments({ ...query.find }, { limit: 100000 });
};

export async function GET(req: NextRequest, res: NextResponse) {
  console.log("***** INSCRIPTION API CALLED *****");
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
    const query = convertParams(Inscription, req.nextUrl);

    const cacheKey = `inscriptions:${JSON.stringify(query)}`;
    // Try to fetch the result from Redis first
    let cachedResult =
      process.env.NODE_ENV === "production" ? await getCache(cacheKey) : null;

    if (cachedResult) {
      console.debug("using cache to return /inscriptions");
      return NextResponse.json(cachedResult);
    }

    let collection: ICollection | null = null;
    console.dir(query, { depth: null });
    if (req.nextUrl.searchParams.has("slug")) {
      collection = await Collection.findOne({
        slug: req.nextUrl.searchParams.get("slug"),
      }).select("-holders");

      if (!collection) throw new CustomError("Collection Not Found", 404);
      query.find.official_collection = collection._id;
    }
    const projectionFields = getProjectionFields(query.show as string);

    await dbConnect();
    const inscriptions = await fetchInscriptions(query, projectionFields);

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

    const result = {
      inscriptions: processedIns,
      pagination: {
        page: query.start / query.limit + 1,
        limit: query.limit,
        total: totalCount,
      },
      time_taken_to_process: moment.duration(timeTaken).humanize(),
      processing_time: timeTaken,
    };

    await setCache(cacheKey, result, 120);
    return NextResponse.json(result);
  } catch (error: any) {
    if (!error?.status) console.error("Catch Error: ", error);
    return NextResponse.json(
      { message: error.message || error || "Error fetching inscriptions" },
      { status: error.status || 500 }
    );
  }
}

export const dynamic = "force-dynamic";
