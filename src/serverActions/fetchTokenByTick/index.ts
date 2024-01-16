"use server";

import { getCache, setCache } from "@/lib/cache";
import dbConnect from "@/lib/dbConnect";
import { CBRCToken } from "@/models";
import { ICbrcToken } from "@/types/CBRC";

async function fetchTokenByTick(tick: string) {
  if (!tick) {
    throw new Error("Invalid parameters");
  }

  try {
    const cacheKey = `fetchTokenByTick:${tick}`;
    const data = await getCache(cacheKey);
    if (data) {
      return data;
    }
    await dbConnect();

    const cbrc: ICbrcToken | null = await CBRCToken.findOne({
      tick: tick.toLowerCase().trim(),
    });
    if (cbrc) {
      await setCache(
        cacheKey,
        {
          success: true,
          message: "token found",
          cbrc,
        },
        5 * 60 // 5 minutes
      );
      return { success: true, message: "token found", cbrc };
    } else return { success: false, message: "token not found" };
  } catch (err: any) {
    console.error("Error finding token", err);
    return { success: false, message: err.message };
  }
}

export default fetchTokenByTick;
