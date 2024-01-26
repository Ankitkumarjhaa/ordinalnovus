import { NextRequest, NextResponse } from "next/server";
import { Inscribe } from "@/models";
import dbConnect from "@/lib/dbConnect";
import convertParams from "@/utils/api/convertParams";
import { setCache, getCache } from "@/lib/cache";
import apiKeyMiddleware from "@/middlewares/apikeyMiddleware";

const fetchOrders = async (query: any) => {
  console.dir(query, { depth: null });
  return await Inscribe.aggregate([
    { $match: { ...query.find, status: { $ne: "cancelled" } } },
    {
      $lookup: {
        from: "createinscriptions", // The collection name for createInscription documents
        localField: "order_id",
        foreignField: "order_id",
        as: "inscriptions",
      },
    },
    {
      $project: {
        // Specify the fields you want to include
        // Exclude the privkey field as you did before
        order_id: 1,
        receive_address: 1,
        chain_fee: 1,
        service_fee: 1,
        txid: 1,
        createdAt: 1,
        status: 1,
        // Add a new field for the count
        inscriptionCount: { $size: "$inscriptions" },
      },
    },
    { $sort: query.sort },
    { $skip: query.start },
    { $limit: query.limit },
  ]).exec();
};

const countOrders = async (query: any) => {
  return await Inscribe.countDocuments({ ...query.find }, { limit: 100000 });
};

export async function GET(req: NextRequest, res: NextResponse) {
  console.log("***** ORDER API CALLED *****");
  try {
    const middlewareResponse = await apiKeyMiddleware(
      ["inscription"],
      "read",
      []
    )(req);

    if (middlewareResponse) {
      return middlewareResponse;
    }

    const query = convertParams(Inscribe, req.nextUrl);

    console.dir(query, { depth: null });
    // Generate a unique cache key based on the query
    const cacheKey = `inscribe_order:${JSON.stringify(query)}`;
    const data = await getCache(cacheKey);
    if (data) {
      return NextResponse.json(data);
    }

    await dbConnect();
    const orders = await fetchOrders(query);

    const totalCount = await countOrders(query);
    // Cache the result
    const responseData = {
      orders,
      pagination: {
        page: query.start / query.limit + 1,
        limit: query.limit,
        total: totalCount,
      },
    };
    await setCache(cacheKey, responseData, 1 * 60);

    return NextResponse.json(responseData);
  } catch (error: any) {
    if (!error?.status) console.error("Catch Error: ", error);
    return NextResponse.json(
      { message: error.message || error || "Error fetching orders" },
      { status: error.status || 500 }
    );
  }
}

export const dynamic = "force-dynamic";
