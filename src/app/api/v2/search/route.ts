import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import dbConnect from "@/lib/dbConnect";
import apiKeyMiddleware from "@/newMiddlewares/apikeyMiddleware";
import { CustomError } from "@/utils";

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

async function fetchLatestInscriptionData(inscriptionId: string) {
  const response = await axios.get(
    `${process.env.NEXT_PUBLIC_PROVIDER}/api/inscription/${inscriptionId}`
  );
  const data = response.data;
  return data;
}

async function fetchInscriptions(query: any, page: number, limit: number) {
  console.log("Fetching Inscriptions...");

  const skip = (page - 1) * limit;
  const url = `${process.env.NEXT_PUBLIC_API}/inscription`;

  try {
    const response = await axios.get(url, {
      params: {
        ...query,
        apiKey: process.env.API_KEY,
        _start: skip,
        _limit: limit,
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
  console.log("***** Search API Called *****");

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
    const page = Number(req.nextUrl.searchParams.get("page")) || 1;
    const limit = Number(req.nextUrl.searchParams.get("limit")) || 10;
    if (!id) {
      throw new CustomError("No id provided for search", 400);
    }

    let query;

    if (/^[0-9A-Fa-f]{64}i\d$/gm.test(id)) {
      query = { inscriptionId: id };
    } else if (!isNaN(Number(id))) {
      query = { number: Number(id) };
    } else if (/^[0-9a-f]{64}$/i.test(id)) {
      query = { sha: id };
    } else if (isNaN(Number(id))) {
      query = {
        $or: [{ sat_name: id }],
      };
    }

    console.log(query, "SEARCH QUERY");
    await dbConnect();

    if (/^[0-9A-Fa-f]{64}i\d$/gm.test(id) || !isNaN(Number(id))) {
      const { inscriptions, totalCount } = await fetchInscriptions(
        query,
        page,
        limit
      );

      console.log(inscriptions.length, " inscriptions found in db");

      if (inscriptions.length) {
        console.log(
          "if inscriptions have been found in db, fetch latest data as well"
        );
        return NextResponse.json({
          statusCode: 200,
          message: "Fetched Latest Inscription data successfully",
          data: {
            inscriptions,
            pagination: {
              page,
              limit,
              total: totalCount,
            },
          },
        });
      } else if (/^[0-9A-Fa-f]{64}i\d$/gm.test(id)) {
        console.log(
          "if no inscription data in db and id is inscriptionId, try fetching latest data"
        );
        const iData = await fetchLatestInscriptionData(id);
        iData.inscriptionId = id;
        return NextResponse.json({
          statusCode: 200,
          message: "Fetched Latest Inscription data successfully",
          data: {
            inscriptions: [iData],
            pagination: {
              page,
              limit,
              total: totalCount,
            },
          },
        });
      }
    } else {
      const satData = await fetchSatData(id);
      if (!satData) {
        throw new CustomError("Invalid query", 404);
      }
      console.log(satData, "satdata");

      return NextResponse.json({
        statusCode: 200,
        message: "Fetched sat data successfully",
        data: {
          sat: satData,
        },
      });
    }
  } catch (error: any) {
    if (!error?.status) console.error("Catch Error: ", error);
    return NextResponse.json(
      { message: error.message || error || "Error fetching inscriptions" },
      { status: error.status || 500 }
    );
  }
}

export const dynamic = "force-dynamic";
