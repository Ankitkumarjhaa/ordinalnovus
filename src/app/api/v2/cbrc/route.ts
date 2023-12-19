import dbConnect from "@/lib/dbConnect";
import { Inscription, Tx } from "@/models";
import { Icbrc } from "@/types/CBRC";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const url = `https://api.cybord.org/deploy`;
    const { data } = await axios.get(url, {
      params: { order: "creation", offset: 0 },
    });

    if (!data?.items || data.items.length === 0) {
      return NextResponse.json({ message: "No Items Found" }, { status: 404 });
    }
    await dbConnect();
    const itemPromises = data.items.map(async (item: Icbrc) => {
      const q = {
        listed: true,
        listed_token: item.tick.trim().toLowerCase(),
      };
      const inscription = await Inscription.findOne(q)
        .sort({ listed_price_per_token: 1 })
        .select("listed_price_per_token");

      return {
        ...item,
        fp: inscription?.listed_price_per_token,
      };
    });

    const updatedItems = await Promise.all(itemPromises);

    // Optional: Additional logic to process or respond with `inscriptions` data

    return NextResponse.json({ items: updatedItems });
  } catch (err) {
    console.error(err); // or use a more advanced error logging mechanism
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}
