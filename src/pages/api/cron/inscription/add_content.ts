import { NextApiRequest, NextApiResponse } from "next";
import { Inscription } from "../../../../models";
import axios from "axios";
import crypto from "crypto";
import dbConnect from "../../../../lib/dbConnect";
import { fetchContentFromProviders } from "@/utils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await dbConnect();

  try {
    console.log("UPDATING content of EXISTING INSCRIPTIONS");

    const inscriptionsToUpdate = await Inscription.find({
      $and: [
        { sha: { $exists: true } },
        { content: { $exists: false } },
        { content_type: "text/html;charset=utf-8" },
      ],
    }).limit(200);

    const bulkOps = [];
    const updatedInscriptionIds = [];

    for (const inscription of inscriptionsToUpdate) {
      const contentResponse = await fetchContentFromProviders(inscription.inscriptionId);
      const content = contentResponse.data.toString("utf-8");

      // Update sha
      const sha = crypto
        .createHash("sha256")
        .update(content, "utf8")
        .digest("hex");

      bulkOps.push({
        updateOne: {
          filter: { _id: inscription._id },
          update: { $set: { content: content, sha: sha } },
        },
      });

      updatedInscriptionIds.push(inscription.inscriptionId);
    }

    await Inscription.bulkWrite(bulkOps);

    res.status(200).json({
      message: "Inscriptions updated successfully",
      updatedInscriptionIds: updatedInscriptionIds,
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: "Error updating inscriptions" });
  }
}
