import { NextRequest, NextResponse } from "next/server";
import { Inscription, Collection } from "@/models";
import dbConnect from "@/lib/dbConnect";
import convertParams from "@/utils/api/newConvertParams";

import apiKeyMiddleware from "@/newMiddlewares/apikeyMiddleware";
import { CustomError } from "@/utils";

const getProjectionFields = (show: string) => {
  if (show === "prune") {
    return "inscription_id number content_type rarity timestamp sha address signed_psbt listed_price listed_at";
  } else if (show === "all") {
    return "-_id -__v -created_at -updated_at";
  } else {
    return show;
  }
};

const fetchInscriptions = async (query: any, projectionFields: string) => {
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
    .exec();
};

const countInscriptions = async (query: any) => {
  return await Inscription.countDocuments({ ...query.find }, { limit: 100000 });
};

export async function GET(req: NextRequest, res: NextResponse) {
  console.log("***** INSCRIPTION API CALLED *****");

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

    return NextResponse.json({
      inscriptions,
      pagination: {
        page: query.start / query.limit + 1,
        limit: query.limit,
        total: totalCount,
      },
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
