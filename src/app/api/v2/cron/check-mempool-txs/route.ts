import dbConnect from "@/lib/dbConnect";
import { Inscription } from "@/models";

export async function GET() {
  try {
    await dbConnect();
    const in_mempool_for_a_day_tx = await Inscription.find({});
  } catch (err: any) {}
}
export const dynamic = "force-dynamic";
