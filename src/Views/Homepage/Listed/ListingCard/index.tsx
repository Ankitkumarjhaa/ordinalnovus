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
type CBRCCardProps = {
  inscriptionId: string;
  content_type?: string;
  content?: string;
  number?: number;
  inscription: IInscription;
  className?: string;
  showCollection?: Boolean;
};

const CBRCCard: React.FC<CBRCCardProps> = ({
  inscriptionId,
  content_type,
  number,
  inscription,
  className = "",
  showCollection = false,
}) => {
  const btcPrice = useSelector(
    (state: RootState) => state.general.btc_price_in_dollar
  );
  return (
    <div className={`card_div p-2 w-full relative`}>
      <Link shallow href={`/inscription/${inscriptionId}`}>
        <div
          className={
            " overflow-hidden relative rounded-xl border xl:border-2 border-accent bg-secondary shadow-xl p-3 " +
            className
          }
        >
          <div className="content-div h-[60%] rounded overflow-hidden relative">
            {inscription?.version && inscription?.version > 0 && (
              <p className="absolute bg-bitcoin rounded font-bold text-yellow-900 text-xs p-1 z-10 top-[5px] right-[5px] ">
                V{inscription.version}
              </p>
            )}
            <CardContent
              inscriptionId={inscriptionId}
              content_type={content_type}
              inscription={inscription}
            />
          </div>

          <div className={`h-[40%] flex flex-col justify-end `}>
            <div className="p-5 mb-2 center">
              <div className="flex-1">
                <h5 className=" text-sm font-bold tracking-tight text-white">
                  #{number || shortenString(inscriptionId)}
                </h5>
                <p className="text-gray-500 text-xs">
                  {content_type && content_type.split(";")[0]}
                </p>
              </div>
              {inscription.listed_price && (
                <div>
                  <div className="text-sm font-bold tracking-tight text-white flex items-center">
                    <div className="mr-2 text-bitcoin">
                      <FaBitcoin className="" />
                    </div>
                    <p className=" ">
                      {convertSatToBtc(inscription?.listed_price)}
                    </p>
                  </div>
                  {inscription.in_mempool ? (
                    <p className="text-gray-500 text-sm">In Mempool</p>
                  ) : (
                    <div className="flex items-center text-gray-500 text-sm">
                      <div className="mr-2 text-bitcoin">
                        <FaDollarSign className="text-green-500" />
                      </div>{" "}
                      <p>
                        {calculateBTCCostInDollars(
                          convertSatToBtc(inscription?.listed_price),
                          btcPrice
                        )}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
            {showCollection &&
              inscription &&
              inscription?.collection_item_name && (
                <span className="bg-yellow-500 rounded-md text-center text-xs py-1 px-3 font-bold text-yellow-900">
                  {inscription.collection_item_name}
                </span>
              )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default CBRCCard;
