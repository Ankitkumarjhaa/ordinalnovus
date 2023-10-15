import { NextApiRequest, NextApiResponse } from "next";
import { Inscription } from "../../../../../models";
import dbConnect from "../../../../../lib/dbConnect";
import { IInscription } from "@/types/Ordinals";

const fetchAndSaveInscriptionsWithSameSHA = async (sha: string) => {
  // console.log('finding inscriptions with this sha: ', sha)
  const inscriptionsWithSameSHA = await Inscription.find({ sha }).sort({
    number: 1,
  });
  // if (inscriptionsWithSameSHA.length > 10000) {
  //   console.log(sha, 'probaably brc-20')
  //   return null
  // }
  // console.log(inscriptionsWithSameSHA.length, ' found with same SHA')
  const bulkOps = inscriptionsWithSameSHA.map(
    (item: IInscription, idx: number) => ({
      updateOne: {
        filter: { _id: item._id },
        update: { $set: { version: idx+1 } },
      },
    })
  );
  await Inscription.bulkWrite(bulkOps);
  return inscriptionsWithSameSHA;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await dbConnect();
  console.log("*** ADDING VERSIONS ***");
  try {
console.time("Aggregate Function Time"); 
  const inscriptions = await Inscription.find({
    version: null,
    sha: { $exists: true },
    content_type: {
      $in: [
        "application/svg",
        "image/svg",
        "image/png",
        "image/jpeg",
        "image/gif",
        "text/html",
        "image/webp",
        "application/xhtml+xml",
        "image/avif",
        "image/svg+xml",
      ],
    },
  }).limit(500);
    
console.timeEnd("Aggregate Function Time");

 


    if (!inscriptions.length) {
      return res.status(200).json({ message: "No inscriptions to update." });
    }

    let totalModified = 0;
    let modifiedShaCounts: Record<string, number> = {};
    let processedShas: Set<string> = new Set();

    console.log(inscriptions.length, "got inscriptions ");

    for (const inscription of inscriptions) {
      if (processedShas.has(inscription.sha)) {
        continue; // Skip SHAs that have already been processed
      }

      const updatedInscriptions = await fetchAndSaveInscriptionsWithSameSHA(
        inscription.sha
      );

      // console.log(updatedInscriptions.length, "updated inscriptions");

      if (updatedInscriptions && updatedInscriptions.length) {
        totalModified += updatedInscriptions.length;
        modifiedShaCounts[inscription.sha] = updatedInscriptions.length; // Count the number of modified files for this SHA

         processedShas.add(inscription.sha);
        
      }
      processedShas.add(inscription.sha);
    }

    const sortedModifiedShaCounts = Object.entries(modifiedShaCounts)
      .sort(([, a], [, b]) => b - a) // Sort by values (counts) in descending order
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {} as Record<string, number>);

    res.status(200).json({
      message: "Inscriptions fetched and updated successfully",
      totalModified: totalModified,
      modifiedShaCounts: sortedModifiedShaCounts, // This will return the SHA and the corresponding count of modified files
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({
      message: "Error fetching and updating inscriptions",
    });
  }
}
