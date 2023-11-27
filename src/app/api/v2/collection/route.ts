// app/api/v2/collection/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Inscription, Collection } from "@/models";
import dbConnect from "@/lib/dbConnect";
import convertParams from "@/utils/api/newConvertParams";
import { getCache, setCache } from "@/lib/cache";
import apiKeyMiddleware from "@/newMiddlewares/apikeyMiddleware";
import { CustomError } from "@/utils";
import { ICollection } from "@/types";

//TODO: return collection volume data
async function getListingData(collections: ICollection[]) {
  const updatedCollections = await Promise.all(
    collections.map(async (collection) => {
      // Fetch inscriptions for each collection
      const inscriptions = await Inscription.find({
        official_collection: collection._id,
        listed: true,
      }).sort({ listed_price: 1 });

      // Count the number of listed
      const listed = inscriptions.length || 0;

      // Find the inscription with the lowest listed_price
      let fp = inscriptions[0]?.listed_price || 0;
      // Return the updated collection object
      return {
        ...collection,
        listed,
        fp,
      };
    })
  );

  return updatedCollections;
}

async function getCollections(query: any) {
  try {
    const coll = await Collection.find(query.find)
      .where(query.where)
      .populate({
        path: "inscription_icon",
        select: "inscription_id content_type number",
      })
      .sort(query.sort)
      .skip(query.start)
      .limit(query.limit)

      .select(
        "-error -error_tag -__v -created_at -updated_at -errored -errored_inscriptions "
      )

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
      collection.min = lowestInscription.inscription_number;
      collection.max = highestInscription.inscription_number;
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

    query.find.supply = { $gt: 0 };

    // Generate a unique key for this query
    const cacheKey = `collections:${JSON.stringify(query)}`;

    // Try to fetch the result from Redis first
    let cachedResult =
      process.env.NODE_ENV === "production" ? await getCache(cacheKey) : null;

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
      const collections: any = await getCollections(query);
      const totalCount = await getTotalCount(query);

      if (collections.length === 1) {
        const inscriptionsData = await getInscriptionsRange(collections);

        // Convert the collection document to a plain JavaScript object
        let collection = collections[0].toObject();

        collection.min = inscriptionsData.lowestInscription.number;
        collection.max = inscriptionsData.highestInscription.number;
        collections[0] = collection;
      }

      const updatedCollections = await getListingData(collections);

      // Construct the result
      const result = {
        collections: updatedCollections,
        pagination: {
          page: query.start / query.limit + 1,
          limit: query.limit,
          total: totalCount,
        },
      };

      // await resetCollections();
      // await Collection.deleteOne({ slug: "btc-artifacts" });

      // Store the result in Redis for 30 minutes
      await setCache(cacheKey, result, 60 * 30);

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

const resetCollections = async () => {
  try {
    const result = await Collection.updateMany(
      {}, // This empty object means that the update will apply to all documents
      {
        $set: {
          updated: 0,
          supply: 0,
          errored: 0,
          errored_inscriptions: [],
        },
      }
    );

    console.log(`Successfully reset collections.`);
  } catch (error) {
    console.error("Error resetting collections:", error);
  }
};
