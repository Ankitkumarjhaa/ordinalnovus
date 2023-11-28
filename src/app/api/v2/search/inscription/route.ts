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

async function fetchLatestInscriptionData(inscriptionId: string) {
  const url = `${process.env.NEXT_PUBLIC_PROVIDER}/api/inscription/${inscriptionId}`;
  const response = await axios.get(url);
  const data = response.data;
  return data;
}

async function fetchInscriptions(query: any, page: number, limit: number) {
  console.log("Fetching Inscriptions...");

  console.log({ query }, "sending to fetch");

  const skip = (page - 1) * limit;
  try {
    const response = await Inscription.find({ ...query })
      .limit(limit || 20)
      .populate({
        path: "official_collection",
        select: "name slug supply updated verified featured",
      })
      .select("-created_at -updated_at -error_tag -error-retry -error ");

    const inscriptions = response || [];
    const totalCount = response.length;

    return { inscriptions, totalCount };
  } catch (error) {
    console.error("Error fetching inscriptions:", error);
    throw error;
  }
}

export async function GET(req: NextRequest, res: NextResponse<Data>) {
  console.log("***** Search Inscription API Called *****");

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
      query = { inscription_id: id };
    } else if (!isNaN(Number(id))) {
      query = { inscription_number: Number(id) };
    }
    // else if (/^[0-9a-f]{64}$/i.test(id)) {
    //   query = { sha: id };
    // }
    // else if (isNaN(Number(id))) {
    //   query = {
    //     sat_name: id,
    //     content: id,
    //   };
    // }

    await dbConnect();

    const { inscriptions, totalCount } = await fetchInscriptions(
      query,
      page,
      limit
    );

    console.log(inscriptions.length, " inscriptions found in db");

    if (inscriptions.length) {
      return NextResponse.json({
        statusCode: 200,
        message: "Fetched Inscription data successfully",
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
      iData.inscription_id = id;
      iData.from_ord = true;
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
    } else {
      return NextResponse.json(
        {
          message: "ID is invalid",
        },
        {
          status: 500,
        }
      );
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
