import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import dbConnect from "@/lib/dbConnect";
import apiKeyMiddleware from "@/newMiddlewares/apikeyMiddleware";
import { CustomError } from "@/utils";
import { Inscription } from "@/models";

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

async function fetchInscriptions(query: any, page: number, limit: number) {
  console.log("Fetching Inscriptions...");

  const skip = (page - 1) * limit;
  const url = `${process.env.NEXT_PUBLIC_URL}/api/inscription`;
  console.log(
    {
      ...query,
      apiKey: process.env.API_KEY,
      _start: skip,
      _limit: limit,
      show: "all",
    },
    "QUERY"
  );

  try {
    const response = await axios.get(url, {
      params: {
        ...query,
        apiKey: process.env.API_KEY,
        _start: skip,
        _limit: limit,
        match: "regex",
        show: "all",
      },
      headers: { "Content-Type": "application/json" },
    });

    const inscriptions = response.data.inscriptions;
    const totalCount = response.data.pagination.total;

    return { inscriptions, totalCount };
  } catch (error) {
    console.error("Error fetching inscriptions:", error);
    throw error;
  }
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

    let query;

    console.log(query, "SEARCH QUERY");
    const satData = await fetchSatData(id);
    if (!satData) {
      throw new CustomError("Invalid query", 404);
    }
    console.log(satData, "satdata");
    if (satData.inscriptions.length > 0) {
      satData.inscriptions = await Inscription.find({
        inscriptionId: { $in: satData.inscriptions },
      })
        .select(
          "token inscriptionId content content_type version officialCollection tags address"
        )
        .populate("officialCollection");
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
