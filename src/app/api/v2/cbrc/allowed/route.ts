import dbConnect from "@/lib/dbConnect";
import { AllowedCbrcs } from "@/models";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await dbConnect();
    const allowed = await AllowedCbrcs.findOne().lean();
    return NextResponse.json({ allowed: allowed?.allowed_cbrcs });
  } catch (err: any) {
    return NextResponse.json(
      { message: "Error fetching allowed tokens" },
      { status: 500 }
    );
  }
}
export const dynamic = "force-dynamic";
