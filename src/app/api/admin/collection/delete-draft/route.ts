import apiKeyMiddleware from "@/middlewares/apikeyMiddleware";
import { Collection } from "@/models";
import { unlink } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { join } from "path";

export async function POST(req: NextRequest) {
  const middlewareResponse = await apiKeyMiddleware(
    ["collection"],
    "delete",
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
      await Collection.deleteOne({ slug });
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
