import { ICollection } from "@/types/Ordinals";
import React from "react";
import Hero from "./Hero";
import Items from "./Items";
type CollectionDetailPageProps = {
  collections: ICollection[];
  inscriptionCount: number;
};
function CollectionDetailPage({
  collections,
  inscriptionCount,
}: CollectionDetailPageProps) {
  return (
    <div className="pt-16">
      <Hero data={collections[0]} />
      <Items collection={collections[0]} total={inscriptionCount} />
    </div>
  );
}

export default CollectionDetailPage;
