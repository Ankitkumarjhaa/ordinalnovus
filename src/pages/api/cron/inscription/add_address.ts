import { NextApiRequest, NextApiResponse } from "next";
import { Inscription } from "../../../../models";
import axios from "axios";
import dbConnect from "../../../../lib/dbConnect";
import { fetchContentFromProviders } from "@/utils";

async function fetchInscriptionDetails(inscriptionId: string): Promise<any> {
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_PROVIDER}/api/inscription/${inscriptionId}`
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching details for ${inscriptionId}: ${error}`);
    return null;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await dbConnect();

  try {
    console.log("UPDATING address of EXISTING INSCRIPTIONS");

    const inscriptionsToUpdate = await Inscription.find({
      address: { $exists: false },
      brc20: { $exists: false },
      content_type: "text/plain"
    }).limit(100);

    const bulkOps:any = [];
    const updatedInscriptionIds:any = [];
    const fetchPromises = inscriptionsToUpdate.map(async (inscription) => {
      const details = await fetchInscriptionDetails(inscription.inscriptionId);
      if (details) {
        const contentResponse = await fetchContentFromProviders(inscription.inscriptionId);
        let brc20 = false;
        let content = contentResponse.data;
        try {
          const parsedContent = JSON.parse(content.toString("utf-8"));

          if (parsedContent.p === "brc-20") {
            brc20 = true;
          }
        } catch (error) {
          // console.log("Error parsing JSON:", error);
        }
        const { address, location, offset, output, output_value } = details;
        bulkOps.push({
          updateOne: {
            filter: { _id: inscription._id },
            update: {
              address,
              location,
              offset,
              output,
              output_value,
              brc20
            },
          },
        });
        updatedInscriptionIds.push(inscription.inscriptionId);
      }
    });

    await Promise.allSettled(fetchPromises);
    if (bulkOps.length > 0) {
      await Inscription.bulkWrite(bulkOps);
    }

    res.status(200).json({
      message: "Inscriptions updated successfully",
      updatedInscriptionIds: updatedInscriptionIds,
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: "Error updating inscriptions" });
  }
}
