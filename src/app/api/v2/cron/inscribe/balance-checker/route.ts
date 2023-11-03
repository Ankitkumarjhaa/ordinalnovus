// app/api/v2/inscribe/balance-checker/route.ts
import { CustomError } from "@/utils";
import { NextRequest, NextResponse } from "next/server";
import { Inscribe } from "@/models";
import dbConnect from "@/lib/dbConnect";
import { addressOnceHadMoney } from "@/utils/Inscribe";

export async function GET(req: NextRequest) {
  const network = process.env.NEXT_PUBLIC_NETWORK || "testnet";

  try {
    await dbConnect();
    const orders = await Inscribe.find({ status: "payment pending" }).limit(
      100
    );
    const funded_addresses: string[] = [];

    await Promise.all(
      orders.map(async (item, i) => {
        const funding_address = item.funding_address;
        const funded = await addressOnceHadMoney(
          funding_address,
          process.env.NETWORK || "testnet",
          item.chain_fee + item.service_fee
        );

        if (funded) {
          // Update the document in the database with the new status
          await Inscribe.updateOne(
            { _id: item._id },
            { $set: { status: "payment received" } }
          );
          funded_addresses.push(funding_address);
        }
      })
    );

    return NextResponse.json({ funded_addresses });
  } catch (error: any) {
    if (!error?.status) console.error("Catch Error: ", error);
    return NextResponse.json(
      { message: error.message || error || "Error creating inscribe order" },
      { status: error.status || 500 }
    );
  }
}
