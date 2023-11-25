import { ICollection } from "@/types";
import React from "react";
import { AiFillCheckCircle } from "react-icons/ai";
import Link from "next/link";
import CardContent from "@/components/elements/CustomCardSmall/CardContent";
import { Tooltip } from "@mui/material";

interface CollectionCardProps {
  item: ICollection;
}

const CollectionCard: React.FC<CollectionCardProps> = ({ item }) => {
  return (
    <div className="w-full md:w-6/12 lg:w-4/12 px-0 py-3 md:p-3">
      <Link href={`/collection/${item.slug}`} shallow prefetch={false}>
        <Tooltip title={item.name} placement="top">
          <div className="p-3 bg-secondary flex items-center rounded-xl shadow-xl ">
            {item?.inscription_icon ? (
              <div className="w-[50px] h-[50px] relative">
                <CardContent
                  inscriptionId={item.inscription_icon.inscription_id}
                  content_type={item.inscription_icon.content_type}
                />
              </div>
            ) : (
              <div className="w-[50px] h-[50px] relative">
                <img src={item.icon} />
              </div>
            )}
            <div className="flex-1 p-3">
              <h3 className="text-white text-sm font-bold capitalize flex items-start">
                {item.name.length > 10
                  ? item.name.slice(0, 10) + "..."
                  : item.name}
                {item.verified && (
                  <AiFillCheckCircle className="ml-2 text-yellow-500" />
                )}
              </h3>
              <p className="">Supply: {item.supply}</p>
            </div>
          </div>
        </Tooltip>
      </Link>
    </div>
  );
};

export default CollectionCard;
