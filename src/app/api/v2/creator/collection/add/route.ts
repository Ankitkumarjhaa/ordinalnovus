import dbConnect from "@/lib/dbConnect";
import { Collection } from "@/models";
import apiKeyMiddleware from "@/middlewares/apikeyMiddleware";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    console.log("***** ADD COLLECTION API CALLED *****");
    const middlewareResponse = await apiKeyMiddleware(
      ["collection"],
      "read",
      []
    )(req);

    if (middlewareResponse) {
      return middlewareResponse;
    }

    await dbConnect();
    const body = await req.json();

    // Check if a collection with the same slug already exists
    const existingCollection = await Collection.findOne({ slug: body.slug });

    // If it exists and updated_by is the same, update the collection
    if (
      existingCollection &&
      existingCollection.updated_by === body.updated_by
    ) {
      const updatedCollection = await Collection.findOneAndUpdate(
        { slug: body.slug },
        body,
        { new: true }
      );
      return NextResponse.json({
        ok: true,
        updated: true,
        result: updatedCollection,
      });
    }

    // Otherwise, create a new collection
    const result = await Collection.create(body);
    return NextResponse.json({ ok: true, created: true, result });
  } catch (err: any) {
    console.error(err);
    if (err?.message.includes("duplicate key error")) {
      return NextResponse.json({ ok: false, message: "Slug is not unique" });
    }
    return NextResponse.json(
      { ok: false, message: err.message || err },
      { status: 500 }
    );
  }
}
