import React, { useState } from "react";
import CardContent from "@/components/elements/CustomCardSmall/CardContent";
import {
  calculateBTCCostInDollars,
  convertSatToBtc,
  shortenString,
} from "@/utils";
import Link from "next/link";
import { IInscription } from "@/types";
import { FaBitcoin, FaDollarSign } from "react-icons/fa6";
import { useSelector } from "react-redux";
import { RootState } from "@/stores";
import { Icbrc } from "@/types/CBRC";
type ListingCardProps = {
  inscriptionId: string;
  content_type?: string;
  inscription: Icbrc;
  className?: string;
};

const ListingCard: React.FC<ListingCardProps> = ({
  inscriptionId,
  content_type,
  inscription,
  className = "",
}) => {
  return (
    <div className={`card_div p-2 w-full relative`}>
      <Link shallow href={`/cbrc-20/${inscription.tick}`}>
        <div
          className={
            " overflow-hidden relative rounded-xl border xl:border-2 border-accent bg-secondary shadow-xl p-3 " +
            className
          }
        >
          <div className="content-div h-[60%] rounded overflow-hidden relative">
            <CardContent
              inscriptionId={inscriptionId}
              content_type={content_type}
              cbrc={inscription}
            />
          </div>

          {/* <div className={`h-[40%] flex flex-col justify-end `}>
            <div className="p-5 mb-2 center">
              <div className="flex-1">
                <h5 className=" text-sm font-bold tracking-tight text-white">
                  {inscription.tick}
                </h5>
                <p className="text-gray-500 text-xs">
                  {content_type && content_type.split(";")[0]}
                </p>
              </div>
            </div>
          </div> */}
        </div>
      </Link>
    </div>
  );
};

export default ListingCard;
