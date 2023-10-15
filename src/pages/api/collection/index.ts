// pages/api/collection/index.ts
import { NextApiRequest, NextApiResponse } from "next";
import { Inscription, Collection } from "@/models";
import dbConnect from "../../../lib/dbConnect";
import convertParams from "@/utils/api/convertParams";
import { getCache, setCache } from "@/lib/cache";
import apiKeyMiddleware from "../../../middlewares/apiKeyMiddleware";

async function getCollections(query: any) {
  try {
    return await Collection.find(query.find)
      .where(query.where)
      .populate({
        path: "inscription_icon",
        select: "inscriptionId content_type number",
      })
      .sort(query.sort)
      .skip(query.start)
      .limit(query.limit)
      .exec();
  } catch (error) {
    console.error(error);
    throw new Error("Error fetching collections");
  }
}


async function getTotalCount(query: any) {
  try {
    return await Collection.countDocuments(query.find);
  } catch (error) {
    console.error(error);
    throw new Error("Error fetching total count");
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
        officialCollection: collection._id,
      })
        .sort("number")
        .select("number");

      // Find the inscription with the highest number
      const highestInscription = await Inscription.findOne({
        officialCollection: collection._id,
      })
        .sort("-number") // Sorting in descending order
        .select("number"); // Select only the 'number' field

      // Update the collection with new min and max
      collection.min = lowestInscription.number;
      collection.max = highestInscription.number;
      await Collection.findByIdAndUpdate(collection._id, {
        min: collection.min,
        max: collection.max,
      });

      return { lowestInscription, highestInscription };
    }

    throw new Error("All inscriptions not connected to collection");
  } catch (error) {
    console.error(error);
    throw new Error("Error fetching inscriptions");
  }
}


async function handler(req: NextApiRequest, res: NextApiResponse) {
  await apiKeyMiddleware(["collection"], "read")(req, res, async () => {
    console.log("***** COLLECTION API CALLED *****");
    await dbConnect();

    try {
      const startTime = new Date().getTime();

      const query = convertParams(Collection, req.query);

      // Generate a unique key for this query
      const cacheKey = `collections:${JSON.stringify(query)}`;

      // Try to fetch the result from Redis first
      let cachedResult = await getCache(cacheKey);

      if (cachedResult) {
        // If the result exists in the cache, return it
        res.status(200).json(cachedResult);
      } else {
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
        res.status(200).json(result);
      }

      const endTime = new Date().getTime();
      console.log("Total execution time:", endTime - startTime, "ms");
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  });
}

export default handler;