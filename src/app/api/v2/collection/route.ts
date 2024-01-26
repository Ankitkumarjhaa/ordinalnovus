// app/api/v2/collection/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Inscription, Collection } from "@/models";
import dbConnect from "@/lib/dbConnect";
import convertParams from "@/utils/api/convertParams";
import { getCache, setCache } from "@/lib/cache";
import apiKeyMiddleware from "@/middlewares/apikeyMiddleware";
import { CustomError } from "@/utils";
import { ICollection } from "@/types";

//TODO: return collection volume data
async function getListingData(collections: ICollection[]) {
  const updatedCollections = await Promise.all(
    collections.map(async (collection: ICollection) => {
      // Fetch inscriptions for each collection
      let queryCondition = {};

      if (collection.metaprotocol === "cbrc") {
        queryCondition = {
          listed_token: collection.slug,
          listed: true,
        };
      } else {
        queryCondition = {
          official_collection: collection._id,
          listed: true,
        };
      }

      const inscriptions = await Inscription.find(queryCondition).sort({
        ...(collection.metaprotocol === "cbrc"
          ? { listed_price_per_token: 1 }
          : { listed_price: 1 }),
      });

      // Count the number of listed
      const listed = inscriptions.length || 0;

      // Find the inscription with the lowest listed_price
      let fp = inscriptions[0]?.listed_price || 0;
      if (collection.metaprotocol && collection.metaprotocol === "cbrc")
        fp = inscriptions[0]?.listed_price_per_token;
      // Return the updated collection object
      collection.listed = listed;
      collection.fp = fp;
      return collection;
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
        select: "inscription_id content_type inscription_number",
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

    return {
      lowestInscription: { inscription_number: 0 },
      highestInscription: { inscription_number: 0 },
    };

    // throw new CustomError("All inscriptions not connected to collection");
  } catch (error) {
    console.error(error);
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
    let cachedResult =
      process.env.NODE_ENV === "production" && query.find.live === "true"
        ? await getCache(cacheKey)
        : null;

    if (cachedResult) {
      console.debug("using cache");
      // If the result exists in the cache, return it
      cachedResult.collections = await getListingData(cachedResult.collections);
      return NextResponse.json(cachedResult);
    } else {
      if (query.find.live === true)
        query.find.$expr = {
          $and: [
            { $gt: ["$supply", 1] },
            { $gt: ["$updated", 1] },
            { $eq: ["$supply", "$updated"] },
          ],
        };

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

        collection.min = inscriptionsData.lowestInscription?.inscription_number;
        collection.max =
          inscriptionsData.highestInscription?.inscription_number;
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
      // await resetInscription();

      // Store the result in Redis for 2 hours
      await setCache(cacheKey, result, 2 * 60 * 60);

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
    // Update collections where supply is less than 1
    const result = await Collection.updateMany(
      {
        $or: [
          { supply: { $lt: 2 } },
          { $expr: { $ne: ["$supply", "$updated"] } }, // Replace 'updated' with the appropriate check
        ],
      }, // Query filter
      { $set: { live: false } } // Update operation
    );

    console.debug(
      `Successfully reset collections. Updated count: ${result.modifiedCount}`
    );
  } catch (error) {
    console.error("Error resetting collections:", error);
  }
};

const resetInscription = async () => {
  try {
    // Update collections where supply is less than 1
    const result = await Inscription.updateMany(
      {
        official_collection: "65700e94ab7c0c4832fa63d2",
      }, // Query filter
      {
        $unset: { official_collection: "" }, // Remove 'official_collection'
      }
    );

    console.debug(
      `Successfully reset inscription. Updated count: ${result.modifiedCount}`
    );
  } catch (error) {
    console.error("Error resetting inscription:", error);
  }
};

// async function getCollectionsWithInscriptionVerification(query: any) {
//   try {
//     // Step 1: Fetch collections with supply > 0
//     const collections = await Collection.find({
//       ...query.find,
//       supply: { $gt: 0 },
//     });
//     // ... [other existing query parameters]

//     // Step 2: Verify each collection with its inscriptions
//     for (let collection of collections) {
//       const inscriptionsCount = await Inscription.countDocuments({
//         official_collection: collection._id,
//       });

//       // Check for mismatch and update if necessary
//       if (inscriptionsCount !== collection.supply) {
//         await Collection.updateOne(
//           { _id: collection._id },
//           {
//             live: true,
//             updated: 0,
//             error: false,
//             error_tag: "",
//             supply: 0,
//             errored: 0,
//             errored_inscriptions: [],
//             min: null,
//             max: null,
//           }
//         );

//       }
//     }

//     return collections;
//   } catch (error) {
//     // Your existing error handling
//   }
// }
