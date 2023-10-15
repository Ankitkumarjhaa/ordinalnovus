import { NextApiRequest, NextApiResponse } from "next";
import { Inscription } from "../../../models";

import dbConnect from "../../../lib/dbConnect";
import { fetchInscriptionAddress } from "@/utils/Ordinals";
import apiKeyMiddleware from "@/middlewares/apiKeyMiddleware";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await apiKeyMiddleware(["inscription"], "read")(req, res, async () => {
    await dbConnect();

    try {
      const { inscriptionIds, inscriptionNumbers, field } = req.body;

      let inscriptions = [];

      if (field === "address") {
        if (inscriptionIds && inscriptionIds.length > 0) {
          // Find inscriptions by inscription IDs
          inscriptions = await Inscription.find({
            inscriptionId: { $in: inscriptionIds },
          })
            .select("inscriptionId number")
            .exec();
        } else if (inscriptionNumbers && inscriptionNumbers.length > 0) {
          // Find inscriptions by inscription numbers
          inscriptions = await Inscription.find({
            number: { $in: inscriptionNumbers },
          })
            .select("inscriptionId number")
            .exec();
        }

        // Fetch the address for each Inscription
        const inscriptionsWithAddress = await Promise.all(
          inscriptions.map(async (inscription) => {
            const address = await fetchInscriptionAddress(
              inscription.inscriptionId
            );
            return { ...inscription._doc, address };
          })
        );

        res.status(200).json({ inscriptions: inscriptionsWithAddress });
      } else {
        if (inscriptionIds) {
          const fieldData = await Inscription.find({
            inscriptionId: { $in: inscriptionIds },
          })
            .select(field)
            .exec();

          res.status(200).json({ inscriptions: fieldData });
        } else if (inscriptionNumbers) {
          const fieldData = await Inscription.find({
            number: { $in: inscriptionNumbers },
          })
            .select(field)
            .exec();

          res.status(200).json({ inscriptions: fieldData });
        }
      }
    } catch (error) {
      console.error(error);
      res.status(200).json({ message: "Error fetching data" });
    }
  });
}

export default handler;
