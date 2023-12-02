import dbConnect from "@/lib/dbConnect";
import { Collection } from "@/models";
import apiKeyMiddleware from "@/middlewares/apikeyMiddleware";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    console.log("***** DELETE COLLECTION API CALLED *****");
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
    const existingCollection = await Collection.findOne({
      slug: body.slug,
      live: false,
      supply: 0,
    });

    // If it exists and updated_by is the same, update the collection
    if (
      existingCollection &&
      existingCollection.updated_by === body.updated_by
    ) {
      const updatedCollection = await Collection.deleteOne(
        existingCollection._id
      );
      return NextResponse.json({
        ok: true,
      });
    }

    return NextResponse.json(
      { ok: false, message: "Collection Not Found" },
      { status: 404 }
    );
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
