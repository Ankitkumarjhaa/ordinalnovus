"use server";

import { getCache, setCache } from "@/lib/cache";
import dbConnect from "@/lib/dbConnect";
import { Collection } from "@/models";

// price in $
async function fetchCollectionBySlug(slug: string) {
  if (!slug) {
    throw new Error("Invalid parameters");
  }

  try {
    const cacheKey = `fetchCollectionBySlug:${slug}`;
    const data = await getCache(cacheKey);
    if (data) {
      return data;
    }
    await dbConnect();

    const collection = await Collection.findOne({ slug });
    if (collection) {
      await setCache(
        cacheKey,
        {
          success: true,
          message: "collection found",
          collection,
        },
        60 * 60 // 60 minutes
      );
      return { success: true, message: "collection found", collection };
    } else return { success: false, message: "collection not found" };
  } catch (err: any) {
    console.error("Error finding collection:", err);
    return { success: false, message: err.message };
  }
}

export default fetchCollectionBySlug;
