import { NextRequest, NextResponse } from "next/server";
import { Inscription, Collection } from "@/models";
import dbConnect from "@/lib/dbConnect";
import convertParams from "@/utils/api/convertParams";

import apiKeyMiddleware from "@/middlewares/apikeyMiddleware";
import { CustomError } from "@/utils";
import moment from "moment";

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
  if (query.sort["listed_price"]) query.find["listed"] = true;
  return await Inscription.find(query.find)
    .select(projectionFields)
    .where(query.where)
    .populate({
      path: "official_collection",
      select:
        "name inscription_id inscription_icon supply slug description _id verified featured",
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
    const apiKeyInfo = req.apiKeyInfo;

    const query = convertParams(Inscription, req.nextUrl);
    console.log(query, "QUERY");
    if (req.nextUrl.searchParams.has("slug")) {
      const collection = await Collection.findOne({
        slug: req.nextUrl.searchParams.get("slug"),
      }).select("name");

      if (!collection) throw new CustomError("Collection Not Found", 404);
      query.find.official_collection = collection._id;
    }
    const projectionFields = getProjectionFields(query.show as string);

    await dbConnect();
    const inscriptions = await fetchInscriptions(query, projectionFields);
    const totalCount = await countInscriptions(query);
    const endTime = Date.now(); // Record the end time
    const timeTaken = endTime - startTime; // Calculate the elapsed time
    console.debug(
      "Time Taken to process this: ",
      moment.duration(timeTaken).humanize()
    );

    return NextResponse.json({
      inscriptions,
      pagination: {
        page: query.start / query.limit + 1,
        limit: query.limit,
        total: totalCount,
      },
      time_taken_to_process: moment.duration(timeTaken).humanize(),
      processing_time: timeTaken,
    });
  } catch (error: any) {
    if (!error?.status) console.error("Catch Error: ", error);
    return NextResponse.json(
      { message: error.message || error || "Error fetching inscriptions" },
      { status: error.status || 500 }
    );
  }
}

export const dynamic = "force-dynamic";
