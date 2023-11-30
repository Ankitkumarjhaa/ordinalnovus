import { IInscription } from "@/types";
import React from "react";
import CollectionItemCard from "./ItemCard";
import SkeletonCollectionItemCard from "./SkeletonItemCard";

type ItemProps = {
  data?: IInscription[] | null;
  loading: boolean;
  pageSize: number;
};

function InscriptionDisplay({ data, loading, pageSize }: ItemProps) {
  return (
    <section>
      <div className="flex items-center flex-wrap">
        {loading ? (
          Array.from(Array(pageSize)).map((_, i) => (
            <SkeletonCollectionItemCard key={i} />
          ))
        ) : data && data?.length > 0 ? (
          data?.map((item) => (
            <CollectionItemCard key={item.inscription_id} item={item} />
          ))
        ) : (
          <div className="center w-full py-16">
            <p className="text-lg">No Item Found</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default InscriptionDisplay;