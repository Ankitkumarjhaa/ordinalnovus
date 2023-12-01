"use server";

import dbConnect from "@/lib/dbConnect";
import { Inscription } from "@/models";

const inscriptionIsValid = async (inscription_id: string) => {
  await dbConnect();
  const result = await Inscription.findOne({ inscription_id }).select(
    "_id content_type"
  );

  if (result) return { _id: result._id, content_type: result.content_type };
  else return { err: "inscription invalid" };
};

export default inscriptionIsValid;
