import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import dbConnect from "@/lib/dbConnect";
import apiKeyMiddleware from "@/middlewares/apikeyMiddleware";
import { CustomError } from "@/utils";
import { Inscription, SatCollection } from "@/models";
import { getCache, setCache } from "@/lib/cache";

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

    if (/^[0-9A-Fa-f]{64}i\d+$/gm.test(id)) {
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

    // console.log(inscriptions.length, " inscriptions found in db");

    if (inscriptions.length) {
      const ins = inscriptions[0];
      if (ins && ins.parsed_metaprotocol) {
        if (
          ins.parsed_metaprotocol.includes("cbrc-20") &&
          ins.parsed_metaprotocol.includes("transfer") &&
          ins.valid !== false
        ) {
          try {
            const valid = await checkCbrcValidity(ins.inscription_id);
            if (valid !== undefined) {
              inscriptions[0].cbrc_valid = valid;
              // await updateInscriptionDB(ins.inscription_id, valid);
            } else {
              console.debug("checkCbrcValidity returned undefined");
            }
          } catch (error) {
            console.error("Error in checkCbrcValidity: ", error);
          }
        }
        const reinscriptions = await Inscription.find({ sat: ins.sat })
          .select(
            "inscription_id inscription_number content_type official_collection metaprotocol parsed_metaprotocol sat collection_item_name collection_item_number valid"
          )
          .populate({
            path: "official_collection",
            select: "name slug icon supply _id", // specify the fields you want to populate
          })
          .lean();

        if (reinscriptions.length > 1) {
          ins.reinscriptions = reinscriptions;
        }

        ins.sat_collection = await SatCollection.findOne({
          sat: ins.sat,
        }).populate({
          path: "official_collection",
          select: "name slug icon supply _id", // specify the fields you want to populate
        });

        if (ins.sat_collection) {
          ins.official_collection = ins.sat_collection.official_collection;
          ins.collection_item_name = ins.sat_collection.collection_item_name;
          ins.collection_item_number =
            ins.sat_collection.collection_item_number;
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

export const checkCbrcValidity = async (id: string) => {
  try {
    const cacheKey = `cbrc_status_${id}`;

    // First, check if the status is already in cache
    const cachedData = await getCache(cacheKey);
    if (cachedData !== null) {
      console.log("Invalid. Returning cached data");
      return cachedData; // cachedData is expected to be a boolean
    }

    const { data } = await axios.get(
      `${process.env.NEXT_PUBLIC_CBRC_API}/transfer?q=${id}`
    );

    if (data) {
      // console.dir(data, { depth: null });
      const isValid = !data.transfer.transfered;

      if (isValid === true || isValid === false) {
        // Update InscriptionDB only if transferred is true or false
        await updateInscriptionDB(id, isValid);
        const statusCacheKey = `cbrcValidityCheck:${id}`;

        // Set cache for 120 seconds
        await setCache(statusCacheKey, isValid, 120); // Cache for 2 minutes

        console.log({ id, isValid });
      }

      // If invalid, store 'false' in the cache
      if (!isValid) {
        await setCache(cacheKey, false, 60 * 60); // Cache for 1 hour
      }

      return isValid;
    }

    throw new Error("No data received from the API");
  } catch (e: any) {
    if (e.response.status === 404) {
      {
        await updateInscriptionDB(id, false);
      }
    }
    // Handle errors
    console.error("Error checking CBRC validity:", e.message);
    return false;
  }
};

// Example implementation of updateInscriptionDB (modify as per your DB structure and requirements)
async function updateInscriptionDB(inscriptionId: string, isValid: boolean) {
  let update: any = { valid: isValid };

  if (isValid === false) {
    update = {
      ...update,
      listed: false,
      listed_price: 0,
      listed_price_per_token: 0,
      signed_psbt: "",
      unsigned_psbt: "",
      in_mempool: false,
    };
  }

  if (isValid === true || isValid === false)
    await Inscription.findOneAndUpdate(
      { inscription_id: inscriptionId },
      update
    );
}
export const dynamic = "force-dynamic";
