// app/api/v2/collection/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Inscription, Collection } from "@/models";
import dbConnect from "@/lib/dbConnect";
import convertParams from "@/utils/api/newConvertParams";
import { getCache, setCache } from "@/lib/cache";
import apiKeyMiddleware from "@/newMiddlewares/apikeyMiddleware";
import { CustomError } from "@/utils";

async function getCollections(query: any) {
  try {
    const coll = await Collection.find(query.find)
      .where(query.where)
      .populate({
        path: "inscription_icon",
        select: "inscriptionId content_type number",
      })
      .sort(query.sort)
      .skip(query.start)
      .limit(query.limit)
      .exec();

    return coll;
    // if (coll.length > 0);
    // else {
    //   throw new CustomError("Collection Not Found", 404);
    // }
  } catch (error) {
    throw new CustomError("Collection Not Found", 404);
  }
}

async function getTotalCount(query: any) {
  try {
    return await Collection.countDocuments(query.find);
  } catch (error) {
    throw new CustomError("Error fetching total number of valid collections");
  }
}

async function getInscriptionsRange(collections: any) {
  try {
    const collection = collections[0];

    // Check if the collection already has min and max
    if (collection.min && collection.max) {
      return {
        lowestInscription: { number: collection.min },
        highestInscription: { number: collection.max },
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

      // Update the collection with new min and max
      collection.min = lowestInscription.number;
      collection.max = highestInscription.number;
      await Collection.findByIdAndUpdate(collection._id, {
        min: collection.min,
        max: collection.max,
      });

      return { lowestInscription, highestInscription };
    }

    throw new CustomError("All inscriptions not connected to collection");
  } catch (error) {
    throw new CustomError("Error fetching inscriptions");
  }
}

export async function GET(req: NextRequest, res: NextResponse) {
  try {
    console.log("***** COLLECTION API CALLED *****");
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

    // Generate a unique key for this query
    const cacheKey = `collections:${JSON.stringify(query)}`;

    // Try to fetch the result from Redis first
    let cachedResult = await getCache(cacheKey);

    if (cachedResult) {
      // If the result exists in the cache, return it
      return NextResponse.json(cachedResult);
    } else {
      if (req.nextUrl.searchParams.has("min")) {
        query.find["min"] = {
          $gte: parseInt(req.nextUrl.searchParams.get("min") as string, 10),
        };
      }

      if (req.nextUrl.searchParams.has("max")) {
        query.find["max"] = {
          $lte: parseInt(req.nextUrl.searchParams.get("max") as string, 10),
        };
      }

      // If the result doesn't exist in the cache, query the database
      const collections = await getCollections(query);
      const totalCount = await getTotalCount(query);

      if (collections.length === 1) {
        const inscriptionsData = await getInscriptionsRange(collections);

        // Convert the collection document to a plain JavaScript object
        let collection = collections[0].toObject();

        collection.min = inscriptionsData.lowestInscription.number;
        collection.max = inscriptionsData.highestInscription.number;
        collections[0] = collection;
      }

      // Construct the result
      const result = {
        collections,
        pagination: {
          page: query.start / query.limit + 1,
          limit: query.limit,
          total: totalCount,
        },
      };

      // Store the result in Redis for 1 hour
      await setCache(cacheKey, result, 60 * 60);

      // Return the result
      return NextResponse.json(result);
    }
  } catch (error: any) {
    if (!error?.status) console.error("Catch Error: ", error);
    return NextResponse.json(
      { message: error.message || error || "Error fetching inscriptions" },
      { status: error.status || 500 }
    );
  }
}
export const dynamic = "force-dynamic";
