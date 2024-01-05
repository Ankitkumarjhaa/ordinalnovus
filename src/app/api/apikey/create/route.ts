// app/api/apikey/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { APIKey } from "@/models";
import { v4 as uuidv4 } from "uuid";
import { CustomError } from "@/utils";
import { getCache, setCache } from "@/lib/cache";
import rateLimits, { UserType } from "@/lib/rateLimits";

const HOUR = 60 * 60 * 1000; // 1 hour in milliseconds
const MINUTE = 60 * 1000; // 1 minute in milliseconds

function validateWalletAddress(address: string): boolean {
  const regex = /^[a-z0-9]+$/i;
  return regex.test(address);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const wallet = body.wallet;
    const tag = body?.tag;

    if (!wallet) {
      throw new CustomError("Please provide a valid wallet address", 400);
    }
    await dbConnect();
    // Check if a wallet already has an API key
    const key = await APIKey.findOne({ wallet });
    if (key) {
      const usage = key.count;
      const userType: UserType = key.userType;
      let rateLimit = rateLimits[userType];
      let expirationDate = null;
      if (key.expirationDate) {
        const remainingTime = Math.round(
          (key.expirationDate.getTime() - Date.now()) / MINUTE
        );
        expirationDate =
          remainingTime < 1 ? `now` : `resetting in ${remainingTime} minutes`;
      }
      return NextResponse.json({
        success: true,
        usage,
        userType,
        rateLimit,
        remainingLimit: rateLimit - usage,
        expirationDate,
        details: key,
      });
    }

    const apiKey = uuidv4();
    await APIKey.create({
      apiKey,
      wallet,
      count: 0,
      scopes: [
        { scopeName: "inscription", permissions: ["read"] },
        { scopeName: "collection", permissions: ["read"] },
        { scopeName: "ordapi", permissions: ["read"] },
        { scopeName: "apikey", permissions: ["read"] },
        { scopeName: "search", permissions: ["read"] },
        { scopeName: "order", permissions: ["read", "write"] },
      ],
      userType: "free",
      ...(tag && { tag }),
    });

    //admin key

    // const newAPIKey = await APIKey.create({
    //   apiKey,
    //   wallet,
    //   count: 0,
    //   scopes: [
    //     {
    //       scopeName: "inscription",
    //       permissions: ["read", "write", "delete"],
    //     },
    //     { scopeName: "collection", permissions: ["read", "write", "delete"] },
    //     { scopeName: "ordapi", permissions: ["read", "write", "delete"] },
    //     { scopeName: "apikey", permissions: ["read", "write", "delete"] },
    //     { scopeName: "search", permissions: ["read"] },
    //     { scopeName: "order", permissions: ["read", "write", "delete"] },
    //   ],
    //   userType: "gold",
    // });

    return NextResponse.json(
      { message: "API key created successfully.", apiKey },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Catch Error: ", error);
    return NextResponse.json(
      { message: error.message || error || "Error fetching inscriptions" },
      { status: error.status || 500 }
    );
  }
}

// export default handler;
