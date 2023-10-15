import { NextApiRequest, NextApiResponse } from "next";
import {Inscription} from "../../../../models";
import axios from "axios";
import dbConnect from "../../../../lib/dbConnect";
import crypto from "crypto";
import { fetchContentFromProviders } from "@/utils";
import { IInscription } from "@/types/Ordinals";

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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await dbConnect();

  try {
    const { start, end } = req.query;
    const startN = Number(start);
    let endN = Number(end);
    console.log("Adding MISSED NUMBERS");
    // Find the missing numbers
    const existingNumbers = await Inscription.find(
      { number: { $gte: start, $lte: end } },
      "number"
    );

    // Fetch the highest number document
    const highestNumberDocument = await Inscription.findOne(
      {},
      {},
      { sort: { number: -1 } }
    );
    const highestNumber = highestNumberDocument
      ? highestNumberDocument.number
      : 0;

    if (endN > highestNumber) {
      endN = highestNumber;
    }
    // Adjust the endN value if the difference is more than 50,000
    if (endN - startN > 30000) {
      endN = startN + 30000;
    }

    console.log({ startN, endN });
    const missingNumbers = [];
    for (let number = startN; number <= endN; number++) {
      if (number % 10000 === 0) {
        console.log(`no missing number from ${startN} till ${number}`);
      }
      const exists = existingNumbers.some(
        (inscription: any) => inscription.number === number
      );
      if (!exists) {
        missingNumbers.push(number);
        if (missingNumbers.length >= 50) {
          break;
        }
      }
    }

    if (missingNumbers.length === 0) {
      return res.status(200).json({ message: "No missing inscriptions found" });
    }
    console.log(missingNumbers, "MN");

    const savedInscriptionIds: string[] = [];

    const bulkOps: any[] = [];
    const promises = missingNumbers.map(async (number) => {
      // Fetch and process data for each missing number
      const url = `${process.env.NEXT_PUBLIC_PROVIDER}/api/inscriptions/${number}`;
      const response = await axios.get(url);
      const inscriptionId = response.data.inscriptions[0];

      if (inscriptionId) {
        const contentResponse = await fetchContentFromProviders(inscriptionId);
        const contentType = contentResponse.headers["content-type"];
        let content;
        let sha;
        let brc20 = false;

        if (/text|html|json|javascript/.test(contentType)) {
          content = contentResponse.data;

          try {
            const parsedContent = JSON.parse(content.toString("utf-8"));

            if (parsedContent.p === "brc-20") {
              brc20 = true;
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
              number: number,
              title: "Inscription " + number,
              content_type: contentType,
              content,
              sha,
              brc20,
              ...inscriptionDetails,
            },
          },
        });
        savedInscriptionIds.push(inscriptionId);

        // end
      }
    });

    await Promise.all(promises);
    // Execute bulk operations
    if (bulkOps.length > 0) {
      await Inscription.bulkWrite(bulkOps);
    }

    res
      .status(200)
      .json({ message: "Missing inscriptions fetched and saved successfully", savedInscriptionIds });
  } catch (error) {
    console.error(error);
    return res.status(400).json({
      message: "Error fetching and saving missing inscriptions",
    });
  }
}
