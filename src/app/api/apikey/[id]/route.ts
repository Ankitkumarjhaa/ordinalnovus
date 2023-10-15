import dbConnect from "@/lib/dbConnect";
import rateLimits, { UserType } from "@/lib/rateLimits";
import { APIKey } from "@/models";
import { NextRequest, NextResponse } from "next/server";

const HOUR = 60 * 60 * 1000; // 1 hour in milliseconds
const MINUTE = 60 * 1000; // 1 minute in milliseconds

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  try {
    const key = await APIKey.findOne({
      $or: [{ apiKey: params.id }, { wallet: params.id }],
    }).select("-createdAt -updatedAt _id");

    if (!key) {
      return NextResponse.json(
        { success: false, error: "API key not found" },
        { status: 404 }
      );
    }
    const usage = key.count;

    const userType: UserType = key.userType;
    let expirationDate = null;
    if (key.expirationDate) {
      const remainingTime = Math.round(
        (key.expirationDate.getTime() - Date.now()) / MINUTE
      );
      expirationDate =
        remainingTime < 1 ? `now` : `resetting in ${remainingTime} minutes`;
    }

    let rateLimit = rateLimits[userType];

    return NextResponse.json({
      success: true,
      usage,
      userType,
      rateLimit,
      remainingLimit: rateLimit - usage,
      expirationDate,
      details: key,
    });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 401 });
  }
}
