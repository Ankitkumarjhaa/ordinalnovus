import dbConnect from "@/lib/dbConnect";
import { Wallet } from "@/models";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  await dbConnect();

  const userWallets= await Wallet.find().lean();

  // Find the inscriptions that match your criteria

  if (!userWallets.length) {
    return NextResponse.json({ message: "no wallet found" });
  }
else{
    return NextResponse.json({
       userWallets,
      });
}
 
}
export const dynamic = "force-dynamic";
