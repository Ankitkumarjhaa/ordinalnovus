import React, { useState } from "react";
import CardContent from "@/components/elements/CustomCardSmall/CardContent";
import {
  calculateBTCCostInDollars,
  convertSatToBtc,
  shortenString,
} from "@/utils";
import Link from "next/link";
import { IInscription } from "@/types";
import { FaBitcoin } from "react-icons/fa6";
import { useSelector } from "react-redux";
import { RootState } from "@/stores";
type ListingCardProps = {
  inscriptionId: string;
  content_type?: string;
  content?: string;
  number?: number;
  inscription: IInscription;
  className?: string;
  showCollection?: Boolean;
};

const ListingCard: React.FC<ListingCardProps> = ({
  inscriptionId,
  content_type,
  number,
  inscription,
  className = "h-[220px] 2xl:h-[300px]",
  showCollection = false,
}) => {
  const btcPrice = useSelector(
    (state: RootState) => state.general.btc_price_in_dollar
  );
  return (
    <div className={`card_div p-2 w-full`}>
      <Link shallow href={`/inscription/${inscriptionId}`}>
        <div
          className={
            "relative rounded-xl border xl:border-2 border-accent bg-secondary shadow-xl p-3 " +
            className
          }
        >
          <div className="content-div h-full overflow-hidden">
            {inscription?.version && (
              <p className="absolute bg-bitcoin rounded-full font-bold text-yellow-900 text-xl p-1 z-10 top-0 left-0 ">
                V{inscription.version}
              </p>
            )}
            <CardContent
              inscriptionId={inscriptionId}
              content_type={content_type}
              showTag={true}
            />
          </div>

          <div
            className={`detail-div absolute bottom-0 top-0 left-0 right-0  flex flex-col justify-end bg-gradient-to-b from-transparent to-black`}
          >
            <div className="p-5 mb-2 center">
              <div className="flex-1">
                <h5 className=" text-xl font-bold tracking-tight text-white">
                  {number || shortenString(inscriptionId)}
                </h5>
                <p className="text-gray-500 text-xs">
                  {content_type && content_type.split(";")[0]}
                </p>
              </div>
              {inscription.listed_price && (
                <div>
                  <div className="flex items-center">
                    <div className="mr-3 text-bitcoin">
                      <FaBitcoin className="" />
                    </div>
                    <p>{convertSatToBtc(inscription?.listed_price)}</p>
                  </div>
                  {inscription.in_mempool ? (
                    <p className="text-xs bg-bitcoin text-yellow-900 font-bold p-1 rounded">
                      In Mempool
                    </p>
                  ) : (
                    <p className="text-xs bg-bitcoin text-yellow-900 font-bold p-1 rounded">
                      USD{" "}
                      {calculateBTCCostInDollars(
                        convertSatToBtc(inscription?.listed_price),
                        btcPrice
                      )}
                    </p>
                  )}
                </div>
              )}
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

export default ListingCard;
