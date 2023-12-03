import dbConnect from "@/lib/dbConnect";
import apiKeyMiddleware from "@/middlewares/apikeyMiddleware";
import { Wallet } from "@/models";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  console.log("***** COLLECTING WALLET INFO API CALLED *****");
  const middlewareResponse = await apiKeyMiddleware(
    ["inscription"],
    "read",
    []
  )(req);

  if (middlewareResponse) {
    return middlewareResponse;
  }
  const apiKeyInfo = req.apiKeyInfo;
  if (apiKeyInfo?.userType === "admin") {
    await dbConnect();
    await Wallet.create({
      ...(await req.json()),
      apikey: apiKeyInfo._id,
      tag: apiKeyInfo.tag,
    });
    return NextResponse.json({ ok: true });
  } else {
    return NextResponse.json({ ok: false });
  }
};
