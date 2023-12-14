import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import dbConnect from "@/lib/dbConnect";
import apiKeyMiddleware from "@/middlewares/apikeyMiddleware";
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

  try {
    const response = await Inscription.find({ ...query })
      .limit(limit || 20)
      .populate({
        path: "official_collection",
        select: "name slug supply updated verified featured",
      })
      .select(
        "-created_at -updated_at -error_tag -error-retry -error -signed_psbt -unsigned_psbt"
      )
      .lean();

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

    if (!query) {
      return NextResponse.json({
        statusCode: 404,
        message: "No inscriptions found",
        data: null,
      });
    }
    await dbConnect();

    const { inscriptions, totalCount } = await fetchInscriptions(
      query,
      page,
      limit
    );

    console.log(inscriptions.length, " inscriptions found in db");

    if (inscriptions.length) {
      const ins = inscriptions[0];
      if (ins && ins.parsed_metaprotocol) {
        if (
          ins.parsed_metaprotocol.includes("cbrc-20") &&
          ins.parsed_metaprotocol.includes("transfer")
        ) {
          try {
            const valid = await checkCbrcValidity(ins.inscription_id);
            if (valid !== undefined) {
              inscriptions[0].cbrc_valid = valid;
            } else {
              console.debug("checkCbrcValidity returned undefined");
            }
          } catch (error) {
            console.error("Error in checkCbrcValidity: ", error);
          }
        }
      }
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
    } else if (/^[0-9A-Fa-f]{64}i\d$/gm.test(id) || !isNaN(Number(id))) {
      console.debug(
        "if no inscription data in db and id is inscriptionId, try fetching latest data"
      );
      const iData = await fetchLatestInscriptionData(id);
      // iData.inscription_id = id;
      iData.from_ord = true;
      if (iData) {
        const ins = iData;
        if (ins && ins.metaprotocol) {
          if (
            ins.metaprotocol.includes("cbrc-20") &&
            ins.metaprotocol.includes("transfer")
          ) {
            try {
              const valid = await checkCbrcValidity(ins.inscription_id);
              if (valid !== undefined) {
                iData.cbrc_valid = valid;
              } else {
                console.log("checkCbrcValidity returned undefined");
              }
            } catch (error) {
              console.error("Error in checkCbrcValidity: ", error);
            }
          }
        }
      }
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
    } else if (!isNaN(Number(id)) && Number(id) < 0) {
      console.debug("negative number searched");
      const url = `${process.env.NEXT_PUBLIC_PROVIDER}/api/inscriptions/${id}`;
      const response = await fetch(url);
      const inscriptionIds = await response.json();
      // Check if there are any inscriptions and use the first ID
      if (inscriptionIds.inscriptions.length > 0) {
        const inscriptionId = inscriptionIds.inscriptions[0];
        const iData = await fetchLatestInscriptionData(inscriptionId);
        iData.inscription_id = inscriptionId;
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
        // Handle the case where no inscriptions are returned
        return NextResponse.json({
          statusCode: 404,
          message: "No inscriptions found",
          data: null,
        });
      }
    } else {
      console.debug("ID is invalid");
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

const checkCbrcValidity = async (id: string) => {
  try {
    console.log("checking cbrc validity...");
    const { data } = await axios.get(`https://api.cybord.org/transfer?q=${id}`);

    if (data) {
      console.log({ check_data: data });
      return !data.transfer.transferred;
    }

    throw new Error("No data received from the API");
  } catch (e: any) {
    // Check if the error is a 500 status code
    if (
      e.response &&
      (e.response.status === 500 || e.response.status === 400)
    ) {
      throw new Error("Cyborg API is down (500 Server Error)");
    }

    // Handle other types of errors
    console.error("Error checking CBRC validity:", e.message);
    return false;
  }
};
export const dynamic = "force-dynamic";
