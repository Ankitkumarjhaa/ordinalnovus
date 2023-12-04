// app/api/v2/cron/collection/connect-inscription-to-collection/route.ts
import axios from "axios";
import { Collection, Inscription } from "@/models";
import { NextResponse } from "next/server";
import { wait } from "@/utils";
import dbConnect from "@/lib/dbConnect";

const CHUNK_SIZE = 100; // Adjust the chunk size based on your requirements

async function fetchInscriptions(slug: string) {
  const url = `https://raw.githubusercontent.com/ordinals-wallet/ordinals-collections/main/collections/${slug}/inscriptions.json`;
  const response = await axios.get(url);
  return response.data;
}

async function processChunk(chunk: any, collection: any) {
  const err = collection.errored_inscriptions || [];
  const bulkOps = [];

  // console.dir(chunk, { depth: null });

  for (const inscription of chunk) {
    const inscription_id = inscription.id;
    let collection_item_name = collection.name;
    let collection_item_number = collection.updated;

    if (
      inscription.meta &&
      inscription.meta.name &&
      inscription.meta.name.includes("#")
    ) {
      collection_item_name = inscription.meta.name.split("#")[0].trim();

      collection_item_number =
        Number(inscription.meta.name.split("#")[1].trim()) ||
        collection.updated;
    }
    let attributes = [];
    if (inscription.meta && inscription.meta.attributes)
      attributes = inscription.meta.attributes || [];

    try {
      const inscription = await Inscription.findOne({
        inscription_id,
      });

      if (inscription && inscription._id) {
        bulkOps.push({
          updateOne: {
            filter: { inscription_id: inscription_id },
            update: {
              $set: {
                official_collection: collection._id,
                collection_item_name,
                collection_item_number,
                attributes: attributes,
              },
            },
          },
        });

        collection.updated += 1;
        console.debug(
          `Updated count for collection ${collection.name} is : ${collection.updated}`
        );
      } else {
        console.debug(`Inscription not found: ${inscription_id}`);
        err.push(inscription_id);
        collection.errored += 1;
      }
    } catch (error) {
      console.error("Error updating inscription:", error);
      collection.errored += 1;
    }
  }

  collection.errored_inscriptions = err;

  if (bulkOps.length > 0) {
    console.debug(
      `Performing bulk write operation for ${bulkOps.length} inscriptions.`
    );
    await Inscription.bulkWrite(bulkOps);
    console.debug("Bulk write operation completed.");
  }
}

export async function GET() {
  try {
    await dbConnect();
    console.debug("Searching for collections to update");
    let collection = await Collection.findOne({
      supply: 0,
      error: false,
    }).populate("inscription_icon");

    if (!collection) {
      console.debug("No collections to update");
      return NextResponse.json({ message: "No collections to update" });
    }

    console.debug(`Found collection to update: ${collection.name}`);
    const inscriptionsCount = await Inscription.countDocuments({
      official_collection: collection._id,
    });

    console.debug(
      `Number of inscriptions in database for collection: ${inscriptionsCount}`
    );
    if (collection.supply && inscriptionsCount === collection.supply) {
      console.debug("All items already in DB");
      collection.updated = collection.supply;
      collection.errored = 0;
      collection.erroredInscriptions = [];
      collection.save();
      return NextResponse.json({
        collection,
        message: "All item already in DB",
      });
    }

    const inscriptions = await fetchInscriptions(collection.slug);
    console.debug(
      `Fetched ${inscriptions.length} inscriptions from GitHub for collection: ${collection.name}`
    );

    if (inscriptions.length === 0) {
      collection.error = true;
      collection.error_tag = "collection has no items";
      collection.live = false;
      await wait(3);
      collection.save();
      return NextResponse.json({
        message: "Collection didnt have any inscription ",
      });
    }

    if (
      collection.inscription_icon &&
      collection.inscription_icon.content_type
    ) {
      collection.tags = collection.inscription_icon.tags;
    }

    collection.supply = inscriptions.length;
    collection.save();

    if (collection.supply && inscriptions.length !== collection.supply) {
      console.debug(
        "Updating collection supply to match number of inscriptions from GitHub"
      );
      collection.supply = inscriptions.length;
    }

    const chunks = [];
    for (let i = 0; i < inscriptions.length; i += CHUNK_SIZE) {
      chunks.push(inscriptions.slice(i, i + CHUNK_SIZE));
    }

    console.debug(
      `Processing ${chunks.length} chunks for collection: ${collection.name}`
    );
    for (const chunk of chunks) {
      await processChunk(chunk, collection);
    }
    console.debug("Saving updated collection");
    console.debug(collection, "UPDATED");
    await wait(3);
    await collection.save();

    console.debug("Collection updated successfully");
    return NextResponse.json({
      collection,
      message: "Collection updated successfully",
    });
  } catch (error) {
    console.error("Error updating collection:", error);
    return NextResponse.json(
      { message: "Failed to update collection" },
      { status: 500 }
    );
  }
}
