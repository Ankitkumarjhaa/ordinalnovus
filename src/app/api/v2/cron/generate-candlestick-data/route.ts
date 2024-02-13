import dbConnect from "@/lib/dbConnect";
import { CBRCCandleDataM } from "@/models";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  await dbConnect();
}
export const dynamic = "force-dynamic";
