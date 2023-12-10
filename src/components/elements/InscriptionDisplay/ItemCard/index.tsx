import { ICollection, IInscription } from "@/types";
import React from "react";
import Link from "next/link";
import CardContent from "@/components/elements/CustomCardSmall/CardContent";

import { FaBitcoin, FaDollarSign } from "react-icons/fa6";
import { useSelector } from "react-redux";
import { RootState } from "@/stores";
import { calculateBTCCostInDollars, convertSatToBtc } from "@/utils";
interface CollectionCardProps {
  inscription: IInscription;
}

const ItemCard: React.FC<CollectionCardProps> = ({ inscription }) => {
  const btcPrice = useSelector(
    (state: RootState) => state.general.btc_price_in_dollar
  );
  return (
    <div className="relative p-3 md:w-6/12 lg:w-3/12  2xl:w-2/12 w-full cursor-pointer">
      <Link href={`/inscription/${inscription.inscription_id}`}>
        <div className="border xl:border-2 border-accent bg-secondary rounded-xl shadow-xl p-3">
          <div className="content-div h-[60%] rounded overflow-hidden relative">
            {inscription?.version && inscription?.version > 0 && (
              <p className="absolute bg-bitcoin rounded font-bold text-yellow-900 text-xs p-1 z-10 top-[5px] right-[5px] ">
                V{inscription.version}
              </p>
            )}
            <CardContent
              inscriptionId={inscription.inscription_id}
              content_type={inscription.content_type}
              inscription={inscription}
            />
          </div>

          <div className={`h-[40%] flex flex-col justify-end `}>
            <div className="p-5 mb-2 center">
              <div className="flex-1">
                <h5 className=" text-sm font-bold tracking-tight text-white">
                  #{inscription.inscription_number}
                </h5>
                <p className="text-gray-500 text-xs">
                  {inscription.content_type &&
                    inscription.content_type.split(";")[0]}
                </p>
              </div>
              {inscription.listed_price ? (
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
              ) : (
                <></>
              )}
            </div>
            {inscription?.domain_valid && (
              <span className="bg-yellow-500 rounded-md text-center text-xs py-1 px-3 font-bold text-yellow-900">
                VALID
              </span>
            )}
            {inscription && inscription?.collection_item_name && (
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

export default ItemCard;
