import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import apiKeyMiddleware from "@/middlewares/apikeyMiddleware";
import { CustomError } from "@/utils";
import { Inscription } from "@/models";
import dbConnect from "@/lib/dbConnect";

type Data = {
  statusCode: number;
  message: string;
  data?: any;
};

async function fetchSatData(satId: string) {
  const response = await axios.get(
    `${process.env.NEXT_PUBLIC_PROVIDER}/api/sat/${satId}`
  );
  const data = response.data;
  return data;
}

export async function GET(req: NextRequest, res: NextResponse<Data>) {
  console.log("***** Search SAT API Called *****");

  try {
    const middlewareResponse = await apiKeyMiddleware(
      ["search"],
      "read",
      []
    )(req);

    if (middlewareResponse) {
      return middlewareResponse;
    }

    const id: string = req.nextUrl.searchParams.get("id") || "";
    if (!id) {
      throw new CustomError("No id provided for search", 400);
    }

    const satData = await fetchSatData(id);
    if (!satData) {
      throw new CustomError("Invalid query", 404);
    }
    await dbConnect();
    if (satData.inscriptions.length > 0) {
      satData.inscriptions = await Inscription.find({
        inscription_id: { $in: satData.inscriptions },
      })
        .select(
          "token inscription_id content content_type version official_collection tags address"
        )
        .populate("official_collection");
    }

    return NextResponse.json({
      statusCode: 200,
      message: "Fetched sat data successfully",
      data: {
        sat: satData,
      },
    });
  } catch (error: any) {
    if (!error?.status) console.error("Catch Error: ", error);
    return NextResponse.json(
      { message: error.message || error || "Error fetching data" },
      { status: error.status || 500 }
    );
  }
}

export const dynamic = "force-dynamic";
