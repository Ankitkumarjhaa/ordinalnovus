import dbConnect from "@/lib/dbConnect";
import { Inscription, Tx } from "@/models";
import { Icbrc } from "@/types/CBRC";
import axios from "axios";
import moment from "moment";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const url = `https://api.cybord.org/deploy`;
    const { data } = await axios.get(url, {
      params: { order: "creation", offset: 0 },
    });

    if (!data?.items || data.items.length === 0) {
      return NextResponse.json({ message: "No Items Found" }, { status: 404 });
    }
    // Get the time frame from query parameters
    const timeFrame = req.nextUrl.searchParams.get("timeFrame");

    // Determine the date range for the aggregation based on timeFrame
    let dateRange = {};
    switch (timeFrame) {
      case "today":
        dateRange = { $gte: moment().startOf("day").toDate() };
        break;
      case "yesterday":
        dateRange = {
          $gte: moment().subtract(1, "days").startOf("day").toDate(),
          $lte: moment().subtract(1, "days").endOf("day").toDate(),
        };
        break;
      case "week":
        dateRange = { $gte: moment().subtract(7, "days").toDate() };
        break;
      case "month":
        dateRange = { $gte: moment().subtract(30, "days").toDate() };
        break;
      case "total":
        // No date filter for total
        break;
      default:
        // Default to total if no valid time frame is provided
        break;
    }
    await dbConnect();
    const itemPromises = data.items.map(async (item: Icbrc) => {
      const q = {
        listed: true,
        listed_token: item.tick.trim().toLowerCase(),
      };
      const inscription = await Inscription.findOne(q)
        .sort({ listed_price_per_token: 1 })
        .select("listed_price_per_token");

      // Building the match query
      const matchQuery: any = {
        parsed_metaprotocol: {
          $elemMatch: {
            pattern: `^${item.tick.trim().toLowerCase()}=`,
            options: "i",
          },
        },
      };
      if (timeFrame !== "total") {
        matchQuery.timestamp = dateRange;
      }

      const pipeline = [
        { $match: matchQuery },
        {
          $group: {
            _id: null,
            totalVolume: { $sum: "$price" },
          },
        },
      ];
      console.dir(pipeline, { depth: null });
      const salesVolume = await Tx.aggregate(pipeline);
      console.log({ salesVolume });
      console.log({ fp: inscription?.listed_price_per_token });

      return {
        ...item,
        fp: inscription?.listed_price_per_token,
        totalVolume: salesVolume[0]?.totalVolume || 0,
      };
    });

    const updatedItems = await Promise.all(itemPromises);

    // Optional: Additional logic to process or respond with `inscriptions` data

    return NextResponse.json({ items: updatedItems });
  } catch (err) {
    console.error(err); // or use a more advanced error logging mechanism
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}
