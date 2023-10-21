import dbConnect from "@/lib/dbConnect";
import axios from "axios";
import { Collection, Inscription } from "@/models";
import { NextRequest, NextResponse } from "next/server";
import { RecentInscription } from "@/types/Ordinals";
import { getCache, setCache } from "@/lib/cache";

type Data = {
  statusCode: number;
  message: string;
  data?: any;
};
export async function GET(req: NextRequest, res: NextResponse<Data>) {
  console.log("***** HOMEPAGE API CALLED *****");

  // Connect to the database
  await dbConnect();

  // Create a unique cache key for this request
  const cacheKey = "homepageData";

  // Try to get the data from the cache
  let data = await getCache(cacheKey);

  // If the data is not in the cache, fetch it and store it in the cache
  if (!data) {
    const featuredCollections = await Collection.find({ featured: true })
      .limit(10)
      .populate("inscription_icon")
      .exec();

    const verifiedCollections = await Collection.find({
      $and: [{ verified: true }],
    })
      .populate("inscription_icon")
      .limit(12)
      .exec();

    // Store the data in the cache
    data = {
      featured: featuredCollections,
      verified: verifiedCollections,
    };
    await setCache(cacheKey, data, 2 * 60 * 60);
  }

  // Fetch recent inscriptions from the external API
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_API}/ordapi/feed?apiKey=${process.env.API_KEY}`
    );
    const recentInscriptions: RecentInscription[] = response?.data || [];

    // Add the recentInscriptions to the data
    data.recentInscriptions = recentInscriptions;

    // Return data in the desired format
    return NextResponse.json({
      statusCode: 200,
      message: "success",
      data,
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
