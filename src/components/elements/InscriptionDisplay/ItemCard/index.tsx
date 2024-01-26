import { ICollection, IInscription } from "@/types";
import React from "react";
import Link from "next/link";
import CardContent from "@/components/elements/CustomCardSmall/CardContent";

import { FaBitcoin, FaDollarSign } from "react-icons/fa6";
import { useSelector } from "react-redux";
import { RootState } from "@/stores";
import { calculateBTCCostInDollars, convertSatToBtc } from "@/utils";
import { useWalletAddress } from "bitcoin-wallet-adapter";
import ListInscriptionCardButton from "../../ListInscriptionCardButton";
import { cbrcValid, myInscription } from "@/utils/validate";
import CreateReinscription from "../../CreateReinscription";
import ReinscriptionCarousel from "../../ReinscriptionCarousel";
interface CollectionCardProps {
  inscription: IInscription;
  refreshData?: any;
  availableCbrcsBalance?: any;
}

const ItemCard: React.FC<CollectionCardProps> = ({
  inscription,
  refreshData,
  availableCbrcsBalance,
}) => {
  const btcPrice = useSelector(
    (state: RootState) => state.general.btc_price_in_dollar
  );

  const allowed_cbrcs = useSelector(
    (state: RootState) => state.general.allowed_cbrcs
  );

  const walletDetails = useWalletAddress();
  return (
    <div
      className={`relative p-6 md:w-6/12 lg:w-3/12 w-full ${
        inscription?.reinscriptions &&
        inscription?.reinscriptions.find((a) => a.valid) &&
        !inscription?.valid &&
        !inscription.cbrc_valid
          ? " hidden"
          : ""
      }`}
    >
      <div className="border xl:border-2 border-accent bg-secondary rounded-xl shadow-xl p-3">
        {inscription.reinscriptions ? (
          <>
            <ReinscriptionCarousel
              data={inscription.reinscriptions}
              latest={inscription}
            />
          </>
        ) : (
          <Link href={`/inscription/${inscription.inscription_id}`}>
            <div className="content-div h-[60%] rounded overflow-hidden relative cursor-pointer">
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
          </Link>
        )}

        <div className={`h-[40%] flex flex-col justify-end `}>
          <div className="py-2 mb-2 center">
            <div className="flex-1">
              <h5 className=" text-sm font-bold tracking-tight text-white">
                #{inscription.inscription_number}
              </h5>
              <p className="text-gray-500 text-xs">
                {inscription?.tags && inscription?.tags[0]}
              </p>
            </div>
            {inscription.listed_price &&
            inscription.listed &&
            inscription.address !== walletDetails?.ordinal_address ? (
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
          {inscription && inscription?.collection_item_name && (
            <span className="bg-yellow-500 mb-2 rounded-md text-center text-xs py-1 px-3 font-bold text-yellow-900">
              {inscription.collection_item_name}
            </span>
          )}
          {inscription.address === walletDetails?.ordinal_address &&
          cbrcValid(inscription, allowed_cbrcs || []) &&
          myInscription(inscription, walletDetails?.ordinal_address || "") ? (
            <ListInscriptionCardButton
              data={inscription}
              refreshData={refreshData}
            />
          ) : (
            <>
              {inscription.address === walletDetails?.ordinal_address &&
              inscription.official_collection &&
              availableCbrcsBalance &&
              availableCbrcsBalance.filter(
                (a: any) =>
                  a.tick ===
                    inscription.official_collection?.name.toLowerCase() ||
                  a.tick === inscription.official_collection?.slug.toLowerCase()
              ) &&
              myInscription(
                inscription,
                walletDetails?.ordinal_address || ""
              ) ? (
                <CreateReinscription data={inscription} />
              ) : (
                <div className="xl:py-8"></div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemCard;
