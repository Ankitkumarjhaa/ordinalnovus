"use server";

import dbConnect from "@/lib/dbConnect";
import { Collection } from "@/models";

const isSlugValid = async (slug: string) => {
  await dbConnect();

  if (await Collection.findOne({ slug }))
    return "slug already in use by another collection";
  if (!/^[a-z0-9-_]+$/.test(slug)) return "invalid slug";
  else return undefined;
};

export default isSlugValid;
