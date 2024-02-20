"use server";

import dbConnect from "@/lib/dbConnect";
import { CBRCToken } from "@/models";

export async function fetchAllowed() {
  await dbConnect();
  const allowedCbrcsDocs = await CBRCToken.find({ allowed: true }).select(
    "checksum"
  );

  return allowedCbrcsDocs.map((doc: { checksum: any }) => doc.checksum);
}
