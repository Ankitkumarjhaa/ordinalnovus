import mime from "mime";
import { join } from "path";
import { stat, mkdir, writeFile, access } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Collection, Inscription } from "@/models";
import moment from "moment";
import apiKeyMiddleware from "@/middlewares/apikeyMiddleware";
function validateJsonStructure(jsonArray: any) {
  if (!Array.isArray(jsonArray)) {
    return false;
  }

  for (const item of jsonArray) {
    if (
      typeof item !== "object" ||
      item === null ||
      !item.id ||
      !item.meta ||
      !item.meta.name
    ) {
      return false;
    }

    if (item.meta.attributes) {
      if (!Array.isArray(item.meta.attributes)) {
        return false;
      }

      for (const attribute of item.meta.attributes) {
        if (
          typeof attribute !== "object" ||
          attribute === null ||
          !attribute.trait_type ||
          !attribute.value
        ) {
          return false;
        }
      }
    }
  }

  return true;
}

export async function POST(request: NextRequest) {
  console.log("***** INSCRIPTIONS FILE UPLOAD API CALLED *****");
  const middlewareResponse = await apiKeyMiddleware(
    ["collection"],
    "delete",
    [],
    "admin"
  )(request);

  if (middlewareResponse) {
    return middlewareResponse;
  }

  const formData = await request.formData();
  const startTime = Date.now();

  const file = formData.get("file") as Blob | null;
  const slug = formData.get("slug") as string | null; // Retrieving the slug

  if (!file || !slug) {
    return NextResponse.json(
      { error: "File blob and slug are required." },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const relativeUploadDir = `/collections`; // Using slug in the path
  const baseDir =
    process.env.NEXT_PUBLIC_URL === "https://ordinalnovus.com"
      ? "/usr/src/app/static-assets"
      : "/home/crypticmeta/Desktop/static-assets";
  const uploadDir = join(baseDir, relativeUploadDir);

  const filename = `${slug}.${mime.getExtension(file.type)}`;
  const filePath = join(uploadDir, filename);

  try {
    await stat(uploadDir);
  } catch (e: any) {
    if (e.code === "ENOENT") {
      await mkdir(uploadDir, { recursive: true });
    } else {
      console.error(
        "Error while trying to create directory when uploading a file\n",
        e
      );
      return NextResponse.json(
        { error: "Something went wrong." },
        { status: 500 }
      );
    }
  }

  try {
    try {
      // Check if file already exists
      await access(filePath);
      // If the function reaches here, it means the file exists
      return NextResponse.json(
        { message: "File with this slug already exists." },
        { status: 400 }
      );
    } catch (error) {
      if (mime.getExtension(file.type) === "json") {
        // Validate JSON structure if file is a JSON
        const jsonArray = JSON.parse(buffer.toString());
        if (!validateJsonStructure(jsonArray)) {
          return NextResponse.json(
            { message: "Invalid JSON structure." },
            { status: 400 }
          );
        }

        await dbConnect();
        // Extracting all IDs from the JSON array
        const ids = jsonArray.map((item: { id: string }) => item.id);

        // Query the database once for all IDs
        const conflictingInscriptions = await Inscription.find({
          inscription_id: { $in: ids },
          official_collection: { $ne: null },
        }).lean();

        if (conflictingInscriptions.length > 0) {
          // Returning error if there are any conflicts
          return NextResponse.json(
            {
              message: `${conflictingInscriptions[0].inscription_id} belongs to another collection`,
            },
            { status: 400 }
          );
        }
        // If file does not exist, proceed with the upload
        await writeFile(filePath, buffer);
        await Collection.findOneAndUpdate(
          { slug },
          { json_uploaded: true, supply: ids.length }
        );
        const endTime = Date.now(); // Record the end time
        const timeTaken = endTime - startTime; // Calculate the elapsed time
        console.debug(
          "Time Taken to process this: ",
          moment.duration(timeTaken).humanize()
        );
        return NextResponse.json({
          ok: true,
          path: `${relativeUploadDir}/${filename}`,
        });
      }
    }
  } catch (e) {
    console.error("Error while trying to upload a file\n", e);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
