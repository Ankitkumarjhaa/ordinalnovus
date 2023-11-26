"use client";
import CustomButton from "@/components/elements/CustomButton";
import { ICollection } from "@/types";
import React from "react";
import CollectionCard from "./CollectionCard";
import StaticCard from "./StaticCard";

const staticCollections = [
  {
    min: 0,
    max: 1000,
    inscription_icon:
      "c17dd02a7f216f4b438ab1a303f518abfc4d4d01dcff8f023cf87c4403cb54cai0",
    icon_type: "image",
    name: "under 1K",
  },
  {
    min: 0,
    max: 10000,
    inscription_icon:
      "ff38edfab8a5c1f221b8249df3d28f72bd2983d4ee8b1318512368370276c4ffi0",
    icon_type: "image",
    name: "under 10K",
  },
  {
    min: 0,
    max: 100000,
    inscription_icon:
      "402b4f709518411fd64e9b22f75db5d15bfd9505f8d6f68b9f2ef1d481b87eb8i0",
    icon_type: "image",
    name: "under 100K",
  },
];

type CollectionsProps = {
  data: ICollection[];
};

function CollectionsSection({ data }: CollectionsProps) {
  return (
    <section className="pt-16">
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-2xl lg:text-4xl text-white  pb-6">
          Collections
        </h2>
        <div>
          <CustomButton
            link={true}
            text="View All"
            href="/collection"
            hoverBgColor="hover:bg-accent_dark"
            hoverTextColor="text-white"
            bgColor="bg-accent"
            textColor="text-white"
            className="flex transition-all"
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-start">
        {/* {staticCollections.map((item) => (
          <StaticCard key={item.name} item={item} />
        ))} */}
        {data.slice(0, 9).map((item) => (
          <CollectionCard key={item.slug} item={item} />
        ))}
      </div>
    </section>
  );
}

export default CollectionsSection;
