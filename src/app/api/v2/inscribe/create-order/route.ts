// app/api/v2/inscribe/create-order/route.ts
import { CustomError } from "@/utils";
import { NextRequest, NextResponse } from "next/server";
import { fileTypeFromBuffer } from "file-type";

export async function POST(req: NextRequest) {
  const { files, lowPostage, receiveAddress, fee } = await req.json();

  // Validate the input
  if (!files || !Array.isArray(files)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    const fileInfoPromises = files.map(async (f, index) => {
      const { file, dataURL } = f;
      const { type, size, name } = file;
      if (size > 3 * 1024 * 1024) {
        throw new Error(`File at index ${index} exceeds the 3MB size limit`);
      }

      const base64Data = dataURL.split(",")[1];
      return {
        mimeType: type,
        fileSize: size,
        fileName: name,
      };
    });

    const fileInfoArray = await Promise.all(fileInfoPromises);

    return NextResponse.json(fileInfoArray);
  } catch (error: any) {
    if (!error?.status) console.error("Catch Error: ", error);
    return NextResponse.json(
      { message: error.message || error || "Error creating inscribe order" },
      { status: error.status || 500 }
    );
  }
}
