import dbConnect from "@/lib/dbConnect";
import { Collection, Inscription } from "@/models";
import { fetchLatestInscriptionData } from "@/utils/Marketplace";
import { NextResponse } from "next/server";
export async function GET() {
  try {
    await dbConnect();
    const coll = await Collection.findOne({
      slug: "cybr",
    });

    if (!coll) {
      throw new Error("Collection not found");
    }

    const coll_ins = await Inscription.find({
      official_collection: coll._id,
    });

    // Process in chunks
    const chunkSize = 100;
    for (let i = 0; i < coll_ins.length; i += chunkSize) {
      const chunk = coll_ins.slice(i, i + chunkSize);

      console.log("processing chunk: ", i + 1);

      // Process each inscription in the chunk
      for (const item of chunk) {
        const latestData = await fetchLatestInscriptionData(
          item.inscription_id
        );
        // Assuming latestData contains address, location, and output
        await Inscription.updateOne(
          { _id: item._id },
          {
            address: latestData.address,
            location: latestData.location,
            output: latestData.output,
          }
        );
      }

      // await Collection.updateOne({ _id: coll._id }, { updated: i + chunkSize });
      // Wait for 1 second before processing the next batch
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return NextResponse.json({ coll, coll_ins: coll_ins.length });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
