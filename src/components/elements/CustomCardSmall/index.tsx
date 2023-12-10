import React, { useState } from "react";
import CardContent from "./CardContent";
import { shortenString } from "@/utils";
import Link from "next/link";
import { IInscription } from "@/types";
type CustomCardProps = {
  inscriptionId: string;
  content_type?: string;
  content?: string;
  number?: number;
  timestamp?: string;
  price?: number;
  inscription?: IInscription;
  className?: string;
  showCollection?: Boolean;
};

const CustomCard: React.FC<CustomCardProps> = ({
  inscriptionId,
  content_type,
  number,
  inscription,
  className = "h-[220px] 2xl:h-[300px]",
  showCollection = false,
}) => {
  return (
    <div className={`card_div p-2 w-full overflow-hidden`}>
      <Link shallow href={`/inscription/${inscriptionId}`}>
        <div
          className={
            "overflow-hidden relative rounded-xl border xl:border-2 border-accent bg-secondary shadow-xl p-3 " +
            className
          }
        >
          <div className="content-div h-full overflow-hidden">
            <CardContent
              inscriptionId={inscriptionId}
              content_type={content_type}
              inscription={inscription}
            />
          </div>

          <div
            className={`detail-div absolute bottom-0 top-0 left-0 right-0  flex flex-col justify-end bg-gradient-to-b from-transparent to-black`}
          >
            <div className="p-5 mb-2">
              <h5 className=" text-xl font-bold tracking-tight text-white">
                {number || shortenString(inscriptionId)}
              </h5>
              <p className="text-gray-500 text-xs">
                {content_type && content_type.split(";")[0]}
              </p>

              {showCollection &&
                inscription &&
                inscription?.collection_item_name && (
                  <span className="bg-yellow-500 rounded-md text-xs py-1 px-3 font-bold text-yellow-900">
                    {inscription.collection_item_name}
                  </span>
                )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default CustomCard;
