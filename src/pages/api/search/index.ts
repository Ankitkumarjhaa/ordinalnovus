import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

import { Inscription } from "../../../models";

import dbConnect from "../../../lib/dbConnect";

import apiKeyMiddleware from "../../../middlewares/apiKeyMiddleware";

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
        show:"all"
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

async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  await apiKeyMiddleware(["inscription"], "read")(req, res, async () => {
    await dbConnect();

    try {
      const id: string = req.query.id + "";
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      if (!id) {
        res.status(400).json({
          message: "No id provided in the query",
          statusCode: 400,
        });
        return;
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
          return res.status(200).json({
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
          return res.status(200).json({
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
          return res.status(404).json({
            message: `Invalid query`,
            statusCode: 404,
          });
        }
        console.log(satData, 'satdata')

        return res.status(200).json({
          statusCode: 200,
          message: "Fetched sat data successfully",
          data: {
            sat: satData,
          },
        });
      }
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: `Internal server error: ${error.message}`,
        statusCode: 500,
      });
    }
  });
}

export default handler;
