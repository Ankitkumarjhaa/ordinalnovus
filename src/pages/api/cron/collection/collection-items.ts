// pages/api/updateCollection.js
import axios from "axios";
import { Collection, Inscription } from "@/models";
import { NextApiRequest, NextApiResponse } from "next";

const CHUNK_SIZE = 100; // Adjust the chunk size based on your requirements

async function fetchInscriptions(slug: string) {
  const url = `https://raw.githubusercontent.com/ordinals-wallet/ordinals-collections/main/collections/${slug}/inscriptions.json`;
  const response = await axios.get(url);
  return response.data;
}

async function processChunk(chunk: any, collection: any) {
  const err = collection.erroredInscriptions || [];
  const bulkOps = [];

  console.log(`Processing chunk for collection: ${collection.name}`);

  for (const inscription of chunk) {
    const inscriptionId = inscription.id;
    const name =
      inscription.meta.name || collection.name + " #" + collection.updated;
    const attributes = inscription.meta.attributes || [];

    console.log(`Processing inscription: ${inscriptionId}`);

    try {
      const inscription = await Inscription.findOne({
        inscriptionId: inscriptionId,
        officialCollection: null,
      });

      if (inscription) {
        console.log(`Found inscription: ${inscriptionId}`);
        bulkOps.push({
          updateOne: {
            filter: { inscriptionId: inscriptionId },
            update: {
              $set: {
                officialCollection: collection._id,
                name: name,
                attributes: attributes,
              },
            },
          },
        });

        collection.updated += 1;
        console.log(`Updated count for collection: ${collection.updated}`);
      } else {
        console.log(`Inscription not found: ${inscriptionId}`);
        err.push(inscriptionId);
        collection.errored += 1;
      }
    } catch (error) {
      console.error("Error updating inscription:", error);
      collection.errored += 1;
    }
  }

  collection.erroredInscriptions = err;

  if (bulkOps.length > 0) {
    console.log(
      `Performing bulk write operation for ${bulkOps.length} inscriptions.`
    );
    await Inscription.bulkWrite(bulkOps);
    console.log("Bulk write operation completed.");
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    console.log("Received non-GET request");
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  try {
    console.log("Searching for collections to update");
    let collection = await Collection.findOne({
      $expr: { $ne: [{ $add: ["$updated", "$errored"] }, "$supply"] },
    });

    if (!collection) {
      console.log("No collections to update");
      res.status(200).json({ message: "No collections to update" });
      return;
    }

    console.log(`Found collection to update: ${collection.name}`);
    const inscriptionsCount = await Inscription.countDocuments({
      officialCollection: collection._id,
    });

    console.log(
      `Number of inscriptions in database for collection: ${inscriptionsCount}`
    );
    if (inscriptionsCount === collection.supply) {
      console.log("All items already in DB");
      collection.updated = collection.supply;
      collection.errored = 0;
      collection.erroredInscriptions = [];
      collection.save();
      res.status(200).json({ collection, message: "All item already in DB" });
    }

    const inscriptions = await fetchInscriptions(collection.slug);
    console.log(
      `Fetched ${inscriptions.length} inscriptions from GitHub for collection: ${collection.name}`
    );

    if (inscriptions.length !== collection.supply) {
      console.log(
        "Updating collection supply to match number of inscriptions from GitHub"
      );
      collection.supply = inscriptions.length;
    }

    const chunks = [];
    for (let i = 0; i < inscriptions.length; i += CHUNK_SIZE) {
      chunks.push(inscriptions.slice(i, i + CHUNK_SIZE));
    }

    console.log(
      `Processing ${chunks.length} chunks for collection: ${collection.name}`
    );
    for (const chunk of chunks) {
      await processChunk(chunk, collection);
    }

    console.log("Saving updated collection");
    await collection.save();

    console.log("Collection updated successfully");
    res
      .status(200)
      .json({ collection, message: "Collection updated successfully" });
  } catch (error) {
    console.error("Error updating collection:", error);
    res.status(500).json({ message: "Failed to update collection" });
  }
}

