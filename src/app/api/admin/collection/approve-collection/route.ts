import apiKeyMiddleware from "@/middlewares/apikeyMiddleware";
import { Collection, Inscription } from "@/models";
import { unlink } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import fs from "fs/promises";

export async function POST(req: NextRequest) {
  const middlewareResponse = await apiKeyMiddleware(
    ["collection"],
    "write",
    [],
    "admin"
  )(req);

  if (middlewareResponse) {
    return middlewareResponse;
  }

  const { slug } = await req.json();

  if (!slug) {
    return NextResponse.json(
      { error: "Slug is required." },
      {
        status: 400,
      }
    );
  }

  // Assuming the base directory and file extension are known
  const baseDir =
    process.env.NEXT_PUBLIC_URL === "https://ordinalnovus.com"
      ? "/usr/src/app/assets/collections"
      : "/home/crypticmeta/Desktop/assets/collections";
  const filePath = join(baseDir, `${slug}.json`); // Assuming file extension is .json

  try {
    const coll = await Collection.findOne({ slug, live: false });
    if (coll) {
      const fileContent = await fs.readFile(filePath, "utf8"); // read file asynchronously
      const inscriptions = JSON.parse(fileContent); // parse the JSON content

      const chunkSize = 100;
      for (let i = 0; i < inscriptions.length; i += chunkSize) {
        const chunk = inscriptions.slice(i, i + chunkSize);
        await processChunk(chunk, coll); // Assuming `coll` is your collection object
      }
      await coll.save();
      await unlink(filePath);
    }
    // Update database here if necessary

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: "File could not be deleted." },
      { status: 500 }
    );
  }
}

async function processChunk(chunk: any, collection: any) {
  const err = collection.errored_inscriptions || [];
  const bulkOps = [];

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
  collection.live = true;

  if (bulkOps.length > 0) {
    console.debug(
      `Performing bulk write operation for ${bulkOps.length} inscriptions.`
    );
    await Inscription.bulkWrite(bulkOps);
    console.debug("Bulk write operation completed.");
  }
}
