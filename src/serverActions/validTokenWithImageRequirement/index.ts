"use server";

import dbConnect from "@/lib/dbConnect";
import { Collection, SatCollection } from "@/models";
import { ICollection, IInscription } from "@/types";

async function validTokenWithImageRequirement(inscription: IInscription) {
  if (!inscription) {
    throw new Error("Invalid parameters");
  }

  try {
    await dbConnect();

    if (
      !inscription.metaprotocol ||
      !inscription.parsed_metaprotocol ||
      !inscription.tags?.includes("cbrc") ||
      !inscription.parsed_metaprotocol[2]?.includes("=")
    ) {
      return { success: true, message: "Not a CBRC Token" };
    }

    const [tick] = inscription.parsed_metaprotocol[2].split("=");

    const coll: ICollection | null = await Collection.findOne({
      slug: tick.toLowerCase().trim(),
    });

    if (coll) {
      const correctSat = await SatCollection.findOne({
        official_collection: coll._id,
        sat: inscription.sat,
      });
      if (correctSat)
        return { success: true, message: "token is present on valid sat" };
      else {
        return {
          success: false,
          message: "Token is present on invalid sat. Can't list.",
        };
      }
    } else return { success: true, message: "token doesnt need correct sat" };
  } catch (err: any) {
    console.error("Error finding token", err);
    return { success: false, message: err.message };
  }
}

export default validTokenWithImageRequirement;
