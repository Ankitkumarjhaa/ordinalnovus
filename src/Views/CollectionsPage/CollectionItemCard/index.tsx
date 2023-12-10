import React from "react";
import Link from "next/link";
import { Tooltip } from "@mui/material";
import { ICollection } from "@/types";
import CardContent from "@/components/elements/CustomCardSmall/CardContent";
import { shortenString } from "@/utils";
interface CollectionCardProps {
  item: ICollection;
}

const CollectionItemCard: React.FC<CollectionCardProps> = ({ item }) => {
  return (
    <div className={`card_div  p-2 w-full md:w-6/12 lg:w-3/12  2xl:w-2/12`}>
      <Link href={`/collection/${item.slug}`} shallow>
        <Tooltip title={item.name} placement={"top"}>
          <div className="overflow-hidden relative rounded-xl border xl:border-2 border-accent bg-secondary shadow-xl p-3 h-[300px]">
            {item?.inscription_icon?.inscription_id ? (
              <div className="content-div h-full overflow-hidden">
                <CardContent
                  inscriptionId={item.inscription_icon.inscription_id}
                  content_type={item.inscription_icon.content_type}
                  inscription={item.inscription_icon}
                />
              </div>
            ) : (
              <div className="content-div h-full overflow-hidden">
                <img src={item.icon} />
              </div>
            )}

            <div
              className={`detail-div absolute bottom-0 top-0 left-0 right-0  flex flex-col justify-end bg-gradient-to-b from-transparent to-black`}
            >
              <div className="p-5 mb-2">
                <h5 className=" text-xl font-bold tracking-tight text-white">
                  {item.name.length > 15 ? shortenString(item.name) : item.name}
                </h5>
                <p className="text-gray-500 text-xs">Supply: {item.supply}</p>
              </div>
            </div>
          </div>
        </Tooltip>
      </Link>
    </div>
  );
};

export default CollectionItemCard;
