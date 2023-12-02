import mime from "mime";
import { join } from "path";
import { stat, mkdir, writeFile, access } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Collection } from "@/models";

export async function POST(request: NextRequest) {
  const formData = await request.formData();

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
  const uploadDir = join("/home/crypticmeta/Desktop/assets", relativeUploadDir);

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
        { error: "File with this slug already exists." },
        { status: 400 }
      );
    } catch (error) {
      await dbConnect();
      // If file does not exist, proceed with the upload
      await writeFile(filePath, buffer);
      await Collection.findOneAndUpdate({ slug }, { json_uploaded: true });
      return NextResponse.json({
        ok: true,
        path: `${relativeUploadDir}/${filename}`,
      });
    }
  } catch (e) {
    console.error("Error while trying to upload a file\n", e);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
