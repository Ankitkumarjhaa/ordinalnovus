import { NextRequest, NextResponse } from "next/server";
import { Inscription, Collection, SatCollection } from "@/models";
import dbConnect from "@/lib/dbConnect";
import convertParams from "@/utils/api/convertParams";

import apiKeyMiddleware from "@/middlewares/apikeyMiddleware";
import { CustomError } from "@/utils";
import moment from "moment";
import { checkCbrcValidity } from "../search/inscription/route";
import { ICollection, IInscription } from "@/types";
import { getCache, setCache } from "@/lib/cache";

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

export async function processInscriptions(
  inscriptions: IInscription[],
  collection?: ICollection | null
) {
  let satList = [];

  if (collection) {
    const cacheKey = `satList:${collection.slug}`;
    const cachedSatList = await getCache(cacheKey);

    if (cachedSatList) {
      // If data is found in the cache, use it
      satList = cachedSatList;
    } else {
      // If data is not in the cache, fetch it from the database
      const satListInfo = await SatCollection.find({
        official_collection: collection._id,
      })
        .select("sat")
        .lean(); // Improves performance for large datasets

      // Extract the sat numbers from the query results
      satList = satListInfo.map((item) => item.sat);

      // Store the satList in the cache for 1 hour
      await setCache(cacheKey, satList, 3600); // 3600 seconds = 1 hour
    }
  }

  for (const ins of inscriptions) {
    if (ins && ins.parsed_metaprotocol) {
      if (
        ins.parsed_metaprotocol.includes("cbrc-20") &&
        ins.parsed_metaprotocol.includes("transfer") &&
        ins.valid !== false
      ) {
        try {
          console.log("checking validity...");
          const valid = await checkCbrcValidity(ins.inscription_id);
          // Check if the 'valid' variable is not undefined.
          if (valid !== undefined) {
            // If 'valid' is defined, proceed to the next condition.

            // Check if 'satList' (presumably a list of sat numbers) is not empty or undefined.
            if (satList && collection) {
              // If 'satList' exists, check if it includes the 'sat' property of the 'ins' object.
              if (satList.includes(ins.sat)) {
                // If 'satList' contains 'ins.sat', set 'cbrc_valid' property of 'ins' to the value of 'valid'.
                ins.cbrc_valid = valid;

                // Then, update the inscription in the database using the 'updateInscriptionDB' function.
                // This function presumably updates the 'valid' status of an inscription identified by 'inscription_id'.
                await updateInscriptionDB(ins.inscription_id, valid);
              } else {
                console.log(
                  `Marking inscription ${ins.inscription_id} as Invalid because it is inscribed on a sat that does belong to collection: ${collection.slug}`
                );
                // If 'satList' does not contain 'ins.sat', set 'cbrc_valid' property of 'ins' to false.
                ins.cbrc_valid = false;

                // Update the inscription in the database, setting its 'valid' status to false.
                await updateInscriptionDB(ins.inscription_id, false);
              }
            } else {
              // If 'satList' is empty or undefined, directly set 'cbrc_valid' property of 'ins' to the value of 'valid'.
              ins.cbrc_valid = valid;

              // Update the inscription in the database with the current 'valid' value.
              await updateInscriptionDB(ins.inscription_id, valid);
            }
          } else {
            // If 'valid' is undefined, log a debug message indicating that the 'checkCbrcValidity' function
            // returned undefined for a specific inscription ID.
            console.debug(
              "checkCbrcValidity returned undefined for inscription_id: ",
              ins.inscription_id
            );
          }
        } catch (error) {
          console.error(
            "Error in checkCbrcValidity for inscription_id: ",
            ins.inscription_id,
            error
          );
        }
      }
    }
    const reinscriptions = await Inscription.find({ sat: ins.sat })
      .select(
        "inscription_id inscription_number content_type official_collection metaprotocol parsed_metaprotocol sat collection_item_name collection_item_number valid"
      )
      .populate({
        path: "official_collection",
        select: "name slug icon supply _id", // specify the fields you want to populate
      })
      .lean();

    if (reinscriptions.length > 1) {
      ins.reinscriptions = reinscriptions;
    }

    if (collection && collection.metaprotocol === "cbrc") {
      ins.sat_collection = await SatCollection.findOne({
        sat: ins.sat,
      }).populate({
        path: "official_collection",
        select: "name slug icon supply _id", // specify the fields you want to populate
      });
      if (ins.sat_collection) {
        ins.official_collection = ins.sat_collection.official_collection;
        ins.collection_item_name = ins.sat_collection.collection_item_name;
        ins.collection_item_number = ins.sat_collection.collection_item_number;
      }
    }
  }

  return inscriptions; // Return the updated array
}

// Example implementation of updateInscriptionDB (modify as per your DB structure and requirements)
async function updateInscriptionDB(inscriptionId: string, isValid: boolean) {
  await Inscription.findOneAndUpdate(
    { inscription_id: inscriptionId },
    { valid: isValid }
  );
}
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

    const processedIns = await processInscriptions(inscriptions, collection);

    const totalCount = await countInscriptions(query);
    const endTime = Date.now(); // Record the end time
    const timeTaken = endTime - startTime; // Calculate the elapsed time
    console.debug(
      "Time Taken to process this: ",
      moment.duration(timeTaken).humanize()
    );

    return NextResponse.json({
      inscriptions: processedIns,
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
