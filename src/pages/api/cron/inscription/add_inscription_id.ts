import { NextApiRequest, NextApiResponse } from "next";
import { Inscription } from "@/models";
import axios from "axios";
import dbConnect from "@/lib/dbConnect";
import crypto from "crypto";
import { fetchContentFromProviders } from "@/utils";
import { IInscription } from "@/types/Ordinals";
import { AnyBulkWriteOperation } from "mongodb";

// Function to fetch details of a single inscription
async function fetchInscriptionDetails(
  inscriptionId: string
): Promise<Partial<IInscription> | { error: true }> {
  try {
    const { data } = await axios.get(
      `${process.env.NEXT_PUBLIC_PROVIDER}/api/inscription/${inscriptionId}`
    );
    if (!data.sat) throw Error("server down");

    return {
      ...data,
      timestamp: new Date(data.timestamp),
      preview: data._links.preview.href.split("/")[2],
    };
  } catch (error: any) {
    if (
      error.response &&
      (error.response.status === 500 || error.response.status === 502)
    ) {
      return { error: true };
    }
    throw error;
  }
}

// Main handler function
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await dbConnect();
  try {
    console.log("ADDING NEW INSCRIPTIONS");
    const highestInscription = await Inscription.findOne().sort({ number: -1 });
    const start = highestInscription ? highestInscription.number + 1 : 0;
    const { data } = await axios.get(
      `${process.env.NEXT_PUBLIC_PROVIDER}/api/feed`
    );
    const total = data.total;
    const bulkOps: AnyBulkWriteOperation<any>[] = [];
    const savedInscriptionIds: string[] = [];

    // Fetch inscriptions asynchronously
    const promises = Array.from(
      { length: Math.min(200, total - start) },
      async (_, i) => {
        const currentNumber = start + i;
        const url = `${process.env.NEXT_PUBLIC_PROVIDER}/api/inscriptions/${currentNumber}`;
        const { data } = await axios.get(url);
        const inscriptionId = data.inscriptions[0];

        if (!inscriptionId) return;

        const contentResponse = await fetchContentFromProviders(inscriptionId);
        const contentType = contentResponse.headers["content-type"];
        let content;
        let sha;
        let brc20 = false;
        let token = false;

        if (/text|html|json|javascript/.test(contentType)) {
          content = contentResponse.data;

          try {
            const parsedContent = JSON.parse(content.toString("utf-8"));

            if (parsedContent.p === "brc-20") {
              brc20 = true;
              token = true;
            }
            if (
              parsedContent.p === "brc-21" ||
              parsedContent.p.includes("orc")
            ) {
              token = true;
            }
          } catch (error) {
            // console.log("Error parsing JSON:", error);
          }

          if (typeof content === "object") {
            content = contentResponse.data.toString("utf-8");
          }
          sha = crypto
            .createHash("sha256")
            .update(content, "utf8")
            .digest("hex");
        } else if (!/video|audio/.test(contentType)) {
          sha = crypto
            .createHash("sha256")
            .update(contentResponse.data)
            .digest("hex");
        }

        const inscriptionDetails = await fetchInscriptionDetails(inscriptionId);
        bulkOps.push({
          insertOne: {
            document: {
              inscriptionId,
              number: currentNumber,
              content_type: contentType,
              content,
              sha,
              brc20,
              token,
              ...inscriptionDetails,
            },
          },
        });
        savedInscriptionIds.push(inscriptionId);
      }
    );

    await Promise.all(promises);

    if (bulkOps.length > 0) await Inscription.bulkWrite(bulkOps);
    res.status(200).json({
      message: "Inscriptions fetched and saved successfully",
      savedInscriptionIds,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(400)
      .json({ message: "Error fetching and saving inscriptions" });
  }
}

//sha 22e057a8821067b1da52a3b6661b5998011995ff40a36c46555996c5b2d9bf3e
