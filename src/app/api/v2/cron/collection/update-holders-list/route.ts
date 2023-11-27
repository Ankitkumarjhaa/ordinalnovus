// app/api/v2/collection/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Inscription, Collection } from "@/models";
import dbConnect from "@/lib/dbConnect";
import convertParams from "@/utils/api/newConvertParams";
import { getCache, setCache } from "@/lib/cache";
import apiKeyMiddleware from "@/newMiddlewares/apikeyMiddleware";
import { CustomError } from "@/utils";
import { ICollection } from "@/types";
import moment from "moment";

async function calculateHoldersData(collectionId: string) {
  console.log({ collectionId });
  const aggregationPipeline = [
    { $match: { official_collection: collectionId } },
    { $group: { _id: "$address", count: { $sum: 1 } } },
    { $project: { address: "$_id", count: 1, _id: 0 } },
    { $sort: { count: -1 } }, // Sorting by count in descending order
  ];

  //@ts-ignore
  const holders = await Inscription.aggregate(aggregationPipeline);

  console.log("Aggregated " + holders.length + " holders");

  return { holders };
}
async function updateHoldersData(collection: ICollection) {
  if (collection && needToUpdateHolders(collection)) {
    console.log("Updating Holders...");

    const updatedData = await calculateHoldersData(collection._id);
    if (Array.isArray(updatedData.holders)) {
      // Filter out holders with a null address
      const filteredHolders = updatedData.holders.filter(
        (holder) => holder.address !== null
      );

      collection.holders = filteredHolders;
      collection.holders_count = filteredHolders.length;
    } else {
      console.error("Holders data is not in expected format.");
      return; // or handle this scenario appropriately
    }

    collection.holders_check = new Date();
    console.log({ holders: collection.holders }, "UPDATED COLL");

    try {
      // Assuming collection is a Mongoose document and not just a plain object
      await collection.save();
    } catch (error) {
      console.error("Error saving the collection:", error);
      // Handle the error appropriately
    }
  }
}

function needToUpdateHolders(collection: ICollection) {
  const threshold = 24; // 24 hours
  const lastChecked =
    collection.holders_check || collection.supply
      ? moment(collection.holders_check)
      : null;
  const check = !collection.holders_count
    ? true
    : moment().diff(lastChecked, "hours") > threshold;

  console.log({ check });
  return check;
}

async function getCollections(query: any) {
  try {
    console.log(query, { depth: null });
    const coll = await Collection.findOne(query.find)
      // .where(query.where)
      .sort("supply:-1")
      .skip(query.start)
      .exec();

    return coll;
  } catch (error) {
    throw new CustomError("Collection Not Found", 404);
  }
}

async function getInscriptionsRange(collection: ICollection) {
  try {
    // Check if the collection already has min and max
    if (collection.min && collection.max) {
      return {
        lowestInscription: { inscription_number: collection.min },
        highestInscription: { inscription_number: collection.max },
      };
    }

    // If the collection doesn't have min and max, and updated === supply
    if (collection.updated === collection.supply) {
      // Find the inscription with the lowest number
      const lowestInscription = await Inscription.findOne({
        official_collection: collection._id,
      })
        .sort("inscription_number")
        .select("inscription_number");

      // Find the inscription with the highest number
      const highestInscription = await Inscription.findOne({
        official_collection: collection._id,
      })
        .sort("-inscription_number") // Sorting in descending order
        .select("inscription_number"); // Select only the 'number' field

      console.log({ lowestInscription, highestInscription });
      // Update the collection with new min and max
      if (lowestInscription && highestInscription) {
        collection.min = lowestInscription.inscription_number;
        collection.max = highestInscription.inscription_number;
        await Collection.findByIdAndUpdate(collection._id, {
          min: collection.min,
          max: collection.max,
        });
      }

      return { lowestInscription, highestInscription };
    }

    throw new CustomError("All inscriptions not connected to collection");
  } catch (error) {
    console.log(error);
    throw new CustomError("Error fetching inscriptions");
  }
}

export async function GET(req: NextRequest, res: NextResponse) {
  try {
    console.log("***** UPDATE COLLECTION HOLDERS LIST API CALLED *****");

    const startTime = Date.now(); // Record the start time
    const middlewareResponse = await apiKeyMiddleware(
      ["collection"],
      "read",
      []
    )(req);

    if (middlewareResponse) {
      return middlewareResponse;
    }

    await dbConnect();

    const query = convertParams(Collection, req.nextUrl);
    // check once in 2 days
    const oneDayAgo = new Date(new Date().getTime() - 48 * 60 * 60 * 1000);

    query.find.$and = [
      { supply: { $gt: 1 } },
      { updated: { $gt: 1 } },
      { $expr: { $eq: ["$supply", "$updated"] } },
      {
        $or: [
          { holders_count: { $exists: false } },
          { holders_check: { $lt: oneDayAgo } },
        ],
      },
    ];

    // If the result doesn't exist in the cache, query the database
    const collection: any = await getCollections(query);
    if (!collection)
      return NextResponse.json({
        message: "All collection holders up to date",
      });

    const inscriptionsData = await getInscriptionsRange(collection);

    collection.min = inscriptionsData.lowestInscription?.inscription_number;
    collection.max = inscriptionsData.highestInscription?.inscription_number;

    updateHoldersData(collection);

    const endTime = Date.now(); // Record the end time
    const timeTaken = endTime - startTime; // Calculate the elapsed time
    console.log(
      "Time Taken to process this: ",
      moment.duration(timeTaken).humanize()
    );
    // Construct the result
    const result = {
      collection,
      pagination: {
        page: query.start / query.limit + 1,
        limit: query.limit,
      },
      time_taken_to_process: moment.duration(timeTaken).humanize(),
      processing_time: timeTaken,
    };

    // Return the result
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
