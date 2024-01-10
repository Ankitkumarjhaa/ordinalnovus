import { ICollection, IInscription } from "@/types";
import React from "react";
import Link from "next/link";
import CardContent from "@/components/elements/CustomCardSmall/CardContent";

import { FaBitcoin } from "react-icons/fa6";
import { useSelector } from "react-redux";
import { RootState } from "@/stores";
import { calculateBTCCostInDollars, convertSatToBtc } from "@/utils";
import { FaCheckCircle } from "react-icons/fa";
import { IoIosWarning } from "react-icons/io";
interface CollectionCardProps {
  item: IInscription;
  collection: ICollection;
  search?: string;
}

const CollectionItemCard: React.FC<CollectionCardProps> = ({
  item,
  collection,
  search,
}) => {
  const btcPrice = useSelector(
    (state: RootState) => state.general.btc_price_in_dollar
  );
  return (
    <div className="relative p-6 md:w-6/12 lg:w-3/12  w-full cursor-pointer">
      <Link href={`/inscription/${item.inscription_id}`}>
        <div className="border xl:border-2 border-accent bg-secondary rounded-xl shadow-xl p-3">
          <div className="min-h-[300px] md:min-h-[150px] lg:w-full relative rounded-xl overflow-hidden">
            <CardContent
              inscriptionId={item.inscription_id + ""}
              content_type={item.content_type}
              inscription={item}
            />
            {item.listed_price ? (
              <div className="absolute bottom-0 bg-black bg-opacity-70 py-1 px-2 left-0 right-0">
                <div className="flex justify-between items-center py-1">
                  <div className="flex items-center">
                    <div className="mr-3 text-bitcoin">
                      <FaBitcoin className="" />
                    </div>
                    <p>{convertSatToBtc(item?.listed_price)}</p>
                  </div>
                  {item.in_mempool ? (
                    <p className="text-xs bg-bitcoin text-yellow-900 font-bold p-1 rounded">
                      In Mempool
                    </p>
                  ) : (
                    <p className="text-xs bg-bitcoin text-yellow-900 font-bold p-1 rounded">
                      USD{" "}
                      {calculateBTCCostInDollars(
                        convertSatToBtc(item?.listed_price),
                        btcPrice
                      )}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <></>
            )}
            {search &&
              item?.attributes &&
              (() => {
                const matchingAttribute = item.attributes.find((a) =>
                  a.value.toLowerCase().includes(search.toLowerCase())
                );

                if (matchingAttribute) {
                  return (
                    <div className="absolute bottom-0 bg-black bg-opacity-80 py-1 px-2 left-0 right-0 text-xs text-gray-100 flex justify-between">
                      <span>{matchingAttribute.trait_type}</span>
                      <span>{matchingAttribute.value}</span>
                    </div>
                  );
                }
                return null;
              })()}
          </div>
          <div className="p-3 ">
            <div className="flex justify-between">
              <p className="uppercase font-bold text-white text-sm">
                {item.collection_item_name}
                {" #"}
                {item.collection_item_number}
              </p>
              <div className="ml-3">
                {item.cbrc_valid ? (
                  <FaCheckCircle className="text-green-400" />
                ) : (
                  <IoIosWarning className="text-red-400" />
                )}
              </div>
            </div>
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
