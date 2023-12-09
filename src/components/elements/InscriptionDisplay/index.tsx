import { IInscription } from "@/types";
import React from "react";
import ItemCard from "./ItemCard";
import SkeletonCard from "./SkeletonItemCard";

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
          Array.from(Array(pageSize)).map((_, i) => <SkeletonCard key={i} />)
        ) : data && data?.length > 0 ? (
          data?.map((item) => (
            <ItemCard key={item.inscription_id} inscription={item} />
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
