"use server";

import dbConnect from "@/lib/dbConnect";
import { AllowedCbrcs } from "@/models";

export async function fetchAllowed() {
  await dbConnect();
  const allowedCbrcs = await AllowedCbrcs.findOne({});
  return allowedCbrcs.allowed_cbrcs;
}
