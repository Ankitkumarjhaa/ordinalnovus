import dbConnect from "@/lib/dbConnect";
import axios from "axios";
import { Collection, Inscription } from "@/models";
import { NextRequest, NextResponse } from "next/server";
import { ICollection, RecentInscription } from "@/types";
import { getCache, setCache } from "@/lib/cache";

type Data = {
  statusCode: number;
  message: string;
  data?: any;
};

async function getListingData(collections: ICollection[]) {
  const updatedCollections = await Promise.all(
    collections.map(async (collection: any) => {
      // Fetch inscriptions for each collection
      const inscriptions = await Inscription.find({
        official_collection: collection._id,
        listed: true,
      })
        .select("listed_price")
        .sort({ listed_price: 1 })
        .lean();

      // Count the number of listed
      const listed = inscriptions.length || 0;

      // Find the inscription with the lowest listed_price
      let fp = inscriptions[0]?.listed_price || 0;
      // Return the updated collection object
      collection.listed = listed;
      collection.fp = fp;
      return collection;
    })
  );

  return updatedCollections;
}
export async function GET(req: NextRequest, res: NextResponse<Data>) {
  console.log("***** HOMEPAGE API CALLED *****");

  // Connect to the database
  await dbConnect();

  // Create a unique cache key for this request
  const cacheKey = "homepageData";

  // Try to get the data from the cache
  let data: any = await getCache(cacheKey);

  // Fetch recent inscriptions from the external API
  try {
    // If the data is not in the cache, fetch it and store it in the cache
    if (!data) {
      const featuredCollections = await Collection.find({
        featured: true,
        metaprotocol: "cbrc",
      })
        .limit(10)
        .populate({
          path: "inscription_icon",
          select: "content_type inscription_id inscription_number token tags",
        })
        .lean()
        .exec();

      const verifiedCollections = await Collection.find({
        $and: [{ verified: true }],
      })
        .populate({
          path: "inscription_icon",
          select: "content_type inscription_id inscription_number token tags",
        })
        .limit(12)
        .lean()
        .exec();

      // Store the data in the cache
      data = {
        featured: featuredCollections,
        verified: verifiedCollections,
      };
      await setCache(cacheKey, data, 2 * 60);
    }

    data = {
      featured: data.featured,
      verified: data.verified ? await getListingData(data.verified) : [],
    };

    const highestInDB = await Inscription.findOne({})
      .sort({ inscription_number: -1 })
      .select("inscription_number")
      .lean();

    // let recentInscriptions = null;

    // try {
    //   const response = await axios.get(
    //     `${process.env.NEXT_PUBLIC_URL}/api/ordapi/feed?apikey=${process.env.API_KEY}`
    //   );
    //   recentInscriptions = response?.data || [];
    // } catch (err: any) {}

    // // Add the recentInscriptions to the data
    // data.recentInscriptions = recentInscriptions || [];
    // const latestInscription = recentInscriptions
    //   ? recentInscriptions[0].number
    //   : highestInDB.inscription_number;
    // data.latest = latestInscription;
    // data.highest = highestInDB.inscription_number;
    // data.height = highestInDB.genesis_height;
    // data.percentParsed = Number(
    //   ((highestInDB.inscription_number / latestInscription) * 100).toFixed(2)
    // );

    // const listings = await Inscription.find({
    //   listed: true,
    //   parsed_metaprotocol: { $nin: ["mint"] },
    // })
    //   .sort({ listed_at: -1 })
    //   .lean()
    //   .limit(50);

    // data.listings = await processInscriptions(listings);

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
// const removeNullFields = async () => {
//   const updateQuery = {
//     $unset: {
//       domain_name: null,
//       // Add as many fields as you want
//     },
//   };

//   const condition = {
//     $or: [
//       { domain_name: null },
//       // Add conditions for all fields you've included in `updateQuery`
//     ],
//   };
//   await Inscription.updateMany(condition, updateQuery);
// };

// const trimFieldWhitespace = async () => {
//   try {
//     const cursor = await Inscription.find({
//       domain_name: { $exists: true },
//     }).cursor();

//     for await (const doc of cursor) {
//       const value = doc.domain_name;
//       if (typeof value === "string") {
//         const trimmedValue = value.trim();
//         if (value !== trimmedValue) {
//           await Inscription.updateOne(
//             { _id: doc._id },
//             { $set: { domain_name: trimmedValue } }
//           );
//         }
//       }
//     }
//   } catch (error) {
//     console.error("An error occurred:", error);
//   }
// };

export const dynamic = "force-dynamic";
