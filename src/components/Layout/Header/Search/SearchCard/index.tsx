import { ICollection } from "@/types";
import Link from "next/link";
import React from "react";
import { AiFillCheckCircle } from "react-icons/ai";
import CardContent from "@components/elements/CustomCardSmall/CardContent";

interface SearchCardProps {
  collection: ICollection;
  setCollections: React.Dispatch<React.SetStateAction<ICollection[] | null>>;
  setId: React.Dispatch<React.SetStateAction<string>>;
}
const SearchCard: React.FC<SearchCardProps> = ({
  collection,
  setCollections,
  setId,
}) => {
  return (
    <div className="w-full hover:bg-primary-dark px-3 py-1">
      <Link href={`/collection/${collection.slug}`}>
        <div
          className="flex items-center h-full"
          onClick={() => {
            setCollections(null);
            setId("");
          }}
        >
          {collection?.inscription_icon?.inscription_id ? (
            <div className="w-[20px] h-[20px] relative center">
              <CardContent
                inscriptionId={collection.inscription_icon.inscription_id}
                content_type={collection.inscription_icon.content_type}
                inscription={collection.inscription_icon}
              />
            </div>
          ) : (
            <div className="w-[20px] h-[20px] relative center">
              <img src={collection.icon} />
            </div>
          )}

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
