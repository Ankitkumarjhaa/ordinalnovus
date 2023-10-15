import { NextApiRequest, NextApiResponse } from "next";
import { Inscription } from "../../../../models";
import dbConnect from "../../../../lib/dbConnect";
import apiKeyMiddleware from "../../../../middlewares/apiKeyMiddleware";
import axios from "axios";

const batchSize = 100; // Number of duplicates to retrieve per batch

async function fetchDuplicates(start: number, end: number) {
  const pipe = [
    { $skip: start },
    { $limit: end - start + 1 },
    {
      $group: {
        _id: "$number",
        count: { $sum: 1 },
        duplicates: { $addToSet: "$_id" },
      },
    },
    { $match: { count: { $gt: 1 } } },
  ];

  console.log('searcing...')
  const duplicates: any[] = await Inscription.aggregate(pipe).exec();

  console.log("got it...")
   for (const doc of duplicates) {
     // Sort by createdAt, newest first
     const sortedDuplicates = await Inscription.find({
       _id: { $in: doc.duplicates },
     })
       .sort({ createdAt: -1 })
       .exec();

     // Keep the latest document, delete the rest
     const [latestDoc, ...docsToDelete] = sortedDuplicates;

     for (const docToDelete of docsToDelete) {
       await Inscription.findByIdAndDelete(docToDelete._id);
     }
   }

  // for (const doc of duplicates) {
  //   if (doc.duplicates.length > 1) {
  //     let lastItem = null;
  //     console.log(doc.duplicates, 'dupps...')
  //     for (let i = 0; i < doc.duplicates.length; i++) {
  //       const inscription = await Inscription.findById(doc.duplicates[i]);
  //       console.log(inscription.inscriptionId, 'ID')
  //       const url = `${process.env.NEXT_PUBLIC_PROVIDER}/api/inscription/${inscription.inscriptionId}`;
  //       const response = await axios.get(url);
  //       const verifyNumber = response.data.number;

  //       if (inscription.number === verifyNumber) {
  //         lastItem = inscription;
  //       } else {
  //         await Inscription.findByIdAndUpdate(doc.duplicates[i], {
  //           number: verifyNumber,
  //         });
  //       }
  //     }

  //     if (lastItem) {
  //       await Inscription.findByIdAndDelete(lastItem._id);
  //     }
  //   }
  // }

  return duplicates;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await apiKeyMiddleware(["inscription"], "read")(req, res, async () => {
    await dbConnect();

    try {
      const query: any = req.query;
      const start = parseInt(query.start) || 0;
      const end = parseInt(query.end) || batchSize;

      const duplicates: any = await fetchDuplicates(start, end);

      res.status(200);
      res.setHeader("Content-Type", "application/json");
      res.json({
        pagination: {
          modified: duplicates.length,
          start: start,
          end: end,
          nextStart: end + 1,
        },
        duplicates: duplicates,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
}

export default handler;
