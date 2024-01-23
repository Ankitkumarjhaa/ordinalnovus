import dbConnect from "@/lib/dbConnect";
import { Inscription } from "@/models";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const BATCH_SIZE = 500; // Adjust as needed
export async function GET() {
  try {
    const filePath = path.join(
      process.cwd(),
      "public/collections",
      "cybr.json"
    );
    const fileContent = await fs.promises.readFile(filePath, "utf8");
    let jsonData = JSON.parse(fileContent);

    // Validate JSON data
    if (!validateJsonData(jsonData)) {
      throw new Error("Invalid JSON format or duplicate entries found");
    }

    await dbConnect();
    for (let i = 0; i < jsonData.length; i += BATCH_SIZE) {
      const batch = jsonData.slice(i, i + BATCH_SIZE);
      for (let item of batch) {
        console.log({ number: item.item_number });
        if (!item.sat) {
          const doc = await Inscription.findOne({
            inscription_id: item.inscription_id,
          })
            .select("sat inscription_id metadata")
            .lean();
          if (doc) {
            item.sat = doc.sat;
            if (doc.metadata && doc.metadata.attributes)
              item.attributes = doc.metadata.attributes;
            console.log({ sat: doc.sat, Inscription: doc.inscription_id });
          }
        }
      }

      // Optional: Introduce a delay between batches
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay

      // Writing updated batch data back to file after each batch is processed
      await fs.promises.writeFile(
        filePath,
        JSON.stringify(jsonData, null, 2),
        "utf8"
      );
    }

    return NextResponse.json({ jsonData });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

function validateJsonData(jsonData: any) {
  const inscriptionIdSet = new Set();
  const satSet = new Set();
  const itemNumberSet = new Set();

  for (const item of jsonData) {
    if (!item.inscription_id || typeof item.item_number !== "number") {
      return {
        valid: false,
        reason: "Missing or invalid inscription_id or item_number",
      };
    }

    if (inscriptionIdSet.has(item.inscription_id)) {
      return {
        valid: false,
        reason: "Duplicate inscription_id: " + item.inscription_id,
      };
    }
    if (satSet.has(item.sat)) {
      return { valid: false, reason: "Duplicate sat: " + item.sat };
    }
    if (itemNumberSet.has(item.item_number)) {
      return {
        valid: false,
        reason: "Duplicate item_number: " + item.item_number,
      };
    }

    inscriptionIdSet.add(item.inscription_id);
    satSet.add(item.sat);
    itemNumberSet.add(item.item_number);
  }

  return { valid: true };
}
export const dynamic = "force-dynamic";
