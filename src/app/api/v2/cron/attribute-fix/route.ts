import { getCache, setCache } from "@/lib/cache";
import dbConnect from "@/lib/dbConnect";
import { Inscription } from "@/models";
import { IInscription } from "@/types";
import { NextRequest, NextResponse } from "next/server";

// Function to aggregate data
async function aggregateData() {
  await dbConnect();

  const aggregationPipeline = [
    {
      $match: {
        "attributes.value": { $exists: true },
        "attributes.trait_type": { $exists: false },
      },
    },
    {
      $limit: 500,
    },
    {
      $lookup: {
        from: "collections", // Replace with the actual name of your collection
        localField: "official_collection",
        foreignField: "_id",
        as: "official_collection",
      },
    },
    {
      $unwind: "$official_collection",
    },
    {
      $group: {
        _id: "$official_collection.slug",
        inscriptions: { $push: "$$ROOT" },
      },
    },
    {
      $project: {
        _id: 0,
        slug: "$_id",
        inscriptions: 1,
      },
    },
  ];

  return Inscription.aggregate(aggregationPipeline);
}

async function fetchJsonData(slug: string) {
  const cacheKey = `inscriptions-json-${slug}`;
  const cachedData = await getCache(cacheKey);

  // If data is found in cache, return it
  if (cachedData) {
    return cachedData;
  }

  // If not in cache, fetch from URL
  const url = `https://raw.githubusercontent.com/ordinals-wallet/ordinals-collections/main/collections/${slug}/inscriptions.json`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const jsonData = await response.json();

    // Store the fetched data in cache for 1 hour (3600 seconds)
    await setCache(cacheKey, jsonData, 3600);

    return jsonData;
  } catch (error) {
    console.error("Error fetching JSON data:", error);
    return null;
  }
}

async function updateInscriptionsAttributes(
  inscriptions: IInscription[],
  jsonData: [
    {
      id: string;
      meta: { attributes: [{ trait_type: string; value: string }] };
    }
  ]
) {
  const updates = inscriptions
    .map((inscription) => {
      const matchingJson = jsonData.find(
        (jsonItem) => jsonItem.id === inscription.inscription_id
      );
      if (matchingJson) {
        return {
          updateOne: {
            filter: { inscription_id: inscription.inscription_id },
            update: { attributes: matchingJson.meta.attributes },
          },
        };
      }
    })
    .filter(Boolean); // Filter out undefined values in case of no match

  if (updates.length > 0) {
    await Inscription.bulkWrite(updates);
    return updates;
  }
}

export async function GET(req: NextRequest) {
  await dbConnect();

  const inscriptions = await aggregateData();
  // Process each group and fetch its JSON data
  const results = await Promise.all(
    inscriptions.map(async (group) => {
      const jsonData = await fetchJsonData(group.slug);
      const updateRes = await updateInscriptionsAttributes(
        group.inscriptions,
        jsonData
      );
      return {
        slug: group.slug,
        updateRes,
        // inscriptions: group.inscriptions,
        // jsonData: jsonData,
      };
    })
  );
  return NextResponse.json(results);
}
