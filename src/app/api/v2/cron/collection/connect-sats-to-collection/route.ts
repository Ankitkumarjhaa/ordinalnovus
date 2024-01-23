import dbConnect from "@/lib/dbConnect";
import { Collection, Inscription, SatCollection } from "@/models";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const name = "CYBR";
    const slug = name.toLowerCase();
    const filePath = path.join(
      process.cwd(),
      "public/collections",
      `${slug}.json`
    );

    // Read the file content asynchronously
    const fileContent = await fs.promises.readFile(filePath, "utf8");

    const jsonData = JSON.parse(fileContent);

    // Validate JSON data
    if (!validateJsonData(jsonData)) {
      throw new Error("Invalid JSON format or duplicate entries found");
    }

    await dbConnect();
    const coll = await Collection.findOne({
      json_uploaded: true,
      metaprotocol: "cbrc",
      slug,
    });

    if (!coll) {
      throw new Error("Collection not found");
    }

    // Prepare bulk operations
    const bulkOps = jsonData.map((item: any) => ({
      updateOne: {
        filter: { inscription_id: item.inscription_id },
        update: {
          sat: item.sat,
          collection_item_number: item.item_number,
          inscription_id: item.inscription_id,
          collection_item_name: name,
          official_collection: coll._id,
        },
        upsert: true,
      },
    }));

    // Update Inscription documents
    const inscriptionBulkOps = jsonData.map((item: any) => ({
      updateOne: {
        filter: { inscription_id: item.inscription_id },
        update: {
          official_collection: coll._id,
          collection_item_name: name,
          collection_item_number: item.item_number,
          attributes: item?.attributes,
        },
      },
    }));

    await Inscription.bulkWrite(inscriptionBulkOps);

    await Collection.updateOne(
      { _id: coll._id },
      {
        supply: inscriptionBulkOps.length,
        updated: inscriptionBulkOps.length,
        live: true,
      }
    );

    // Perform bulk write
    await SatCollection.bulkWrite(bulkOps);

    return NextResponse.json({ coll, jsonData });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

function validateJsonData(jsonData: any) {
  const inscriptionIdSet = new Set();
  const satSet = new Set();
  const itemNumberSet = new Set();

  for (const item of jsonData) {
    if (
      !item.inscription_id ||
      !item.sat ||
      typeof item.item_number !== "number"
    ) {
      return false;
    }

    if (
      inscriptionIdSet.has(item.inscription_id) ||
      satSet.has(item.sat) ||
      itemNumberSet.has(item.item_number)
    ) {
      return false;
    }

    inscriptionIdSet.add(item.inscription_id);
    satSet.add(item.sat);
    itemNumberSet.add(item.item_number);
  }

  return true;
}
