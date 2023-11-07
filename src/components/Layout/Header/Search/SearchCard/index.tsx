import { ICollection } from "@/types/Ordinals";
import Link from "next/link";
import React from "react";
import { AiFillCheckCircle } from "react-icons/ai";
import CardContent from "@components/elements/CustomCardSmall/CardContent";

interface SearchCardProps {
  collection: ICollection;
  setCollections: React.Dispatch<React.SetStateAction<ICollection[] | null>>;
}
const SearchCard: React.FC<SearchCardProps> = ({
  collection,
  setCollections,
}) => {
  return (
    <div className="w-full hover:bg-primary-dark p-3">
      <Link href={`/collection/${collection.slug}`}>
        <div
          className=" flex items-center h-full"
          onClick={() => setCollections(null)}
        >
          <div className="w-[50px] h-[50px] relative center">
            <CardContent
              inscriptionId={collection.inscription_icon.inscriptionId}
              content_type={collection.inscription_icon.content_type}
            />
          </div>
          <div className="flex-1 pl-2 flex items-center justify-between">
            <div className="center ">
              <h3 className="text-white text-xs font-extrabold capitalize flex collections-start">
                {collection.name}
              </h3>
              <p className="text-xs text-light_gray pl-2">
                {collection.supply} Items
              </p>
            </div>
            {collection.verified && (
              <AiFillCheckCircle className="ml-2 text-yellow-500" />
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default SearchCard;
