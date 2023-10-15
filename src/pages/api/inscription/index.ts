import { NextApiRequest, NextApiResponse } from "next";
import { Inscription } from "../../../models";
import dbConnect from "../../../lib/dbConnect";
import convertParams from "@/utils/api/convertParams";
import apiKeyMiddleware from "../../../middlewares/apiKeyMiddleware";
import { PipelineStage } from "mongoose";
// DONE
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
            else: "$number", // use the number field if the name doesn't follow the pattern
          },
        },
      },
    },
    { $match: query.find },
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
  if (query.sort && (query.sort.name === 1 || query.sort.name === -1)) {
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

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await apiKeyMiddleware(["inscription"], "read")(req, res, async () => {
    console.log("***** INSCRIPTION API CALLED *****");

    await dbConnect();

    try {
      const query = convertParams(Inscription, req.query);
      const projectionFields = getProjectionFields(query.show as string);
      const pipeline = buildPipeline(query);
      const inscriptions = await fetchInscriptions(
        query,
        projectionFields,
        pipeline
      );
      const totalCount = await countInscriptions(query);

      res.status(200).json({
        inscriptions,
        pagination: {
          page: query.start / query.limit + 1,
          limit: query.limit,
          total: totalCount,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(200).json({ message: "Error fetching inscriptions" });
    }
  });
}

export default handler;
