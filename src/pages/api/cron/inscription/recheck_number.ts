import { NextApiRequest, NextApiResponse } from "next";
import { Inscription } from "@/models";
import axios from "axios";
import dbConnect from "../../../../lib/dbConnect";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await dbConnect();

  try {
    const { start, end } = req.query;
    const startN = Number(start);
    const endN = Number(end);

    const dbInscriptions = await Inscription.find(
      { number: { $gte: start, $lte: end } },
      "number"
    ).select("inscriptionId number _id");

    let needsUpdate: any[] = [];

    // Process the inscriptions in batches
    const batchSize = 300;
    for (let i = 0; i < dbInscriptions.length; i += batchSize) {
      const batch = dbInscriptions.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (inscription) => {
          const url = `${process.env.NEXT_PUBLIC_PROVIDER}/api/inscription/${inscription.inscriptionId}`;
          const response = await axios.get(url);
          const verifyNumber = response.data.number;

          if (verifyNumber !== inscription.number) {
            const inscriptionData = {
              inscriptionId: inscription.inscriptionId,
              number: verifyNumber,
              previousNumber: inscription.number,
              title: "Inscription " + verifyNumber,
              _id: inscription._id,
            };
            needsUpdate.push(inscriptionData);
          }
        })
      );
    }

    if (needsUpdate.length === 0) {
      return res
        .status(200)
        .json({ message: "No inscriptions have number, ID Mismatch" });
    }

    // Update the database in batches
    for (let i = 0; i < needsUpdate.length; i += batchSize) {
      const batch = needsUpdate.slice(i, i + batchSize);
      const promises = batch.map((data) => {
        return Inscription.updateOne(
          { _id: data._id },
          {
            number: data.number,
            title: data.title,
          }
        );
      });

      await Promise.all(promises);
    }

    res
      .status(200)
      .json({ message: needsUpdate.length+" Mismatching inscriptions updated", needsUpdate });
  } catch (error) {
    console.error(error);
    return res.status(400).json({
      message: "Error fetching and saving mismatching inscriptions",
    });
  }
}
