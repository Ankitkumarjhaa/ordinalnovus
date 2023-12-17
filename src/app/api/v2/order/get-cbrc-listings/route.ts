import { NextRequest, NextResponse } from "next/server";
import { Inscription, Collection } from "@/models";
import dbConnect from "@/lib/dbConnect";
import convertParams from "@/utils/api/convertParams";

import apiKeyMiddleware from "@/middlewares/apikeyMiddleware";
import moment from "moment";
import { IInscription } from "@/types";
import { checkCbrcValidity } from "../../search/inscription/route";
import { getCache, setCache } from "@/lib/cache";

const fetchInscriptions = async (query: any) => {
  return await Inscription.find(query.find)
    .select("-signed_psbt -unsigned_psbt")
    .where(query.where)
    .sort(query.sort)
    .skip(query.start)
    .limit(query.limit)
    .lean()
    .exec();
};

const countInscriptions = async (query: any) => {
  return await Inscription.countDocuments({ ...query.find }, { limit: 100000 });
};

export async function processInscriptions(inscriptions: IInscription[]) {
  for (const ins of inscriptions) {
    if (ins && ins.parsed_metaprotocol) {
      if (
        ins.parsed_metaprotocol.includes("cbrc-20") &&
        ins.parsed_metaprotocol.includes("transfer")
      ) {
        try {
          const valid = await checkCbrcValidity(ins.inscription_id);
          if (valid !== undefined) {
            ins.cbrc_valid = valid; // Update the current inscription
          } else {
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
  }

  return inscriptions; // Return the updated array
}

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

      // Generate a unique cache key based on the query
      cacheKey = `cbrcListings:${JSON.stringify(query)}`;

      // Try to get cached data
      let cachedData = await getCache(cacheKey);
      if (cachedData) {
        console.log("Responding from cache");
        return NextResponse.json(JSON.parse(cachedData));
      }
    }
    console.log("QUERY>>>");

    console.dir(query, { depth: null });

    await dbConnect();
    const inscriptions = await fetchInscriptions(query);

    const processedIns = await processInscriptions(inscriptions);

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
    await setCache(cacheKey, JSON.stringify(responseData), 3 * 60);

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
