import { ICollection, IInscription } from "@/types/Ordinals";
import React from "react";
import Link from "next/link";
import CardContent from "@/components/elements/CustomCardSmall/CardContent";
interface CollectionCardProps {
  item: IInscription;
  collection: ICollection;
}

const CollectionItemCard: React.FC<CollectionCardProps> = ({
  item,
  collection,
}) => {
  return (
    <div className="relative p-3 md:w-6/12 lg:w-3/12 w-full cursor-pointer">
      <Link href={`/inscription/${item.inscription_id}`}>
        <div className="border xl:border-2 border-accent bg-secondary rounded-xl shadow-xl p-3">
          <div className="min-h-[300px] md:min-h-[150px] lg:w-full relative rounded-xl overflow-hidden">
            <CardContent
              inscriptionId={item.inscription_id + ""}
              content_type={item.content_type}
            />
          </div>
          <div className="p-3 ">
            <p className="uppercase font-bold text-white text-sm">
              {item.collection_item_name}
              {" #"}
              {item.collection_item_number}
            </p>
            {item?.inscription_number && (
              <p className="text-xs">Inscription {item.inscription_number}</p>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default CollectionItemCard;
