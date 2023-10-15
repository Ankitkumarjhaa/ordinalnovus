import { NextRequest, NextResponse } from "next/server";
import { Inscription, Collection } from "@/models";
import dbConnect from "@/lib/dbConnect";
import convertParams from "@/utils/api/newConvertParams";
import { PipelineStage } from "mongoose";

import apiKeyMiddleware from "@/newMiddlewares/apikeyMiddleware";
import { CustomError } from "@/utils";

const getProjectionFields = (show: string) => {
  if (show === "prune") {
    return "inscriptionId number lastChecked content_type rarity timestamp sha address signedPsbt listedPrice listedAt";
  } else if (show === "all") {
    return "-_id -__v -created_at -updated_at";
  } else {
    return show;
  }
};

const buildPipeline = (query: any) => {
  const pipeline: PipelineStage[] = [
    { $match: query.find },
    {
      $addFields: {
        titleNumber: {
          $cond: {
            if: {
              $and: [
                { $eq: [{ $size: { $split: ["$name", "#"] } }, 2] },
                {
                  $regexMatch: {
                    input: {
                      $arrayElemAt: [{ $split: ["$name", "#"] }, 1],
                    },
                    regex: /^[0-9]+$/,
                  },
                },
              ],
            },
            then: {
              $toInt: {
                $arrayElemAt: [
                  {
                    $split: ["$name", "#"],
                  },
                  1,
                ],
              },
            },
            else: "$number",
          },
        },
      },
    },
    { $sort: { titleNumber: 1 } },
    {
      $lookup: {
        from: "collections",
        localField: "officialCollection",
        foreignField: "_id",
        as: "officialCollection",
      },
    },
    {
      $unwind: {
        path: "$officialCollection",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "inscriptions",
        localField: "officialCollection.inscription_icon",
        foreignField: "_id",
        as: "officialCollection.inscription_icon",
      },
    },
    {
      $unwind: {
        path: "$officialCollection.inscription_icon",
        preserveNullAndEmptyArrays: true,
      },
    },
    { $skip: query.start },
    { $limit: query.limit },
    {
      $project: {
        titleNumber: 0,
        created_at: 0,
        updated_at: 0,
        __v: 0,
        "officialCollection._id": 0,
        "officialCollection.__v": 0,
        "officialCollection.updated_at": 0,
        "officialCollection.created_at": 0,
        "officialCollection.errored": 0,
        "officialCollection.updated": 0,
        "officialCollection.erroredInscriptions": 0,
        "officialCollection.updatedBy": 0,
        "officialCollection.inscription_icon.created_at": 0,
        "officialCollection.inscription_icon.updated_at": 0,
      },
    },
  ];

  return pipeline;
};

const fetchInscriptions = async (
  query: any,
  projectionFields: string,
  pipeline: PipelineStage[]
) => {
  if (
    query.sort &&
    (query.sort.name === 1 || query.sort.name === -1) &&
    query.find.officialCollection
  ) {
    console.log("\nusing aggregation pipeline becuase sort = name & slug used");
    return await Inscription.aggregate(pipeline).exec();
  } else {
    return await Inscription.find(query.find)
      .select(projectionFields)
      .where(query.where)
      .populate({
        path: "officialCollection",
        select:
          "name inscriptionId inscription_icon supply slug description _id verified featured",
        populate: {
          path: "inscription_icon",
          select: "inscriptionId content_type",
        },
      })
      .sort(query.sort)
      .skip(query.start)
      .limit(query.limit)
      .exec();
  }
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
    if (req.nextUrl.searchParams.has("slug")) {
      const collection = await Collection.findOne({
        slug: req.nextUrl.searchParams.get("slug"),
      }).select("name");

      if (!collection) throw new CustomError("Collection Not Found", 404);
      query.find.officialCollection = collection._id;
    }
    const projectionFields = getProjectionFields(query.show as string);
    const pipeline = buildPipeline(query);

    await dbConnect();
    const inscriptions = await fetchInscriptions(
      query,
      projectionFields,
      pipeline
    );
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
