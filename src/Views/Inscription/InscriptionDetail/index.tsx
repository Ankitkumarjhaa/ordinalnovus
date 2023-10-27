"use client";

import copy from "copy-to-clipboard";
import { useDispatch, useSelector } from "react-redux";
import { addNotification } from "@/stores/reducers/notificationReducer";
import { IInscription, Transaction, TransactionInput } from "@/types/Ordinals";
import React, { useCallback, useEffect, useState } from "react";
import { AiFillCheckCircle } from "react-icons/ai";
import { BsFillShareFill } from "react-icons/bs";
import { FaFlag } from "react-icons/fa";
import { TfiReload } from "react-icons/tfi";
import DisplayProperties from "./DisplayProperties";
import { useRouter } from "next/navigation";
import { RootState } from "@/stores";
import Link from "next/link";
// import ListInscription from "../ListInscription";
// import BuyInscription from "../BuyInscription";
import moment from "moment";
type InscriptionProps = {
  data: IInscription;
};
function InscriptionDetail({ data }: InscriptionProps) {
  const router = useRouter();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  //wallet
  const walletDetails = useSelector(
    (state: RootState) => state.wallet.walletDetails
  );

  return (
    <div className="p-6 md:pt-0 pb-6 flex-1">
      <div className="pb-2 border-b xl:border-b-2 border-accent">
        <div className="relative">
          {/* <div className="hidden md:block md:absolute top-0 right-0 ml-2">
            <div className="bg-accent w-[30px] h-[30px] rounded-lg center p-1">
              <FaFlag className="text-white " />
            </div>
          </div> */}
          <h3 className="text-3xl font-extrabold text-white">
            Inscription {data?.inscription_number}
          </h3>
        </div>
        {data?.official_collection && (
          <Link shallow href={`/collection/${data?.official_collection?.slug}`}>
            <p className="capitalize pb-1 flex items-baseline hover:underline">
              {data?.collection_item_name}
              {data?.official_collection?.verified && (
                <AiFillCheckCircle className="ml-2 text-yellow-500" />
              )}
            </p>
          </Link>
        )}
        <div className="flex justify-between items-center">
          <p className="text-gray-300 text-xs">
            {moment(data.timestamp).format()}
          </p>
          <div className="flex items-center justify-between">
            <div
              onClick={() => {
                copy(
                  `${process.env.NEXT_PUBLIC_URL}/inscription/${data?.inscription_id}`
                );
                dispatch(
                  addNotification({
                    id: new Date().valueOf(),
                    message: "Link Copied",
                    open: true,
                    severity: "success",
                  })
                );
              }}
              className="flex cursor-pointer items-center mr-4"
            >
              <BsFillShareFill className="text-accent mr-2" />
              Share
            </div>
            <div onClick={() => router.refresh()}>
              <TfiReload className="text-accent cursor-pointer" />
            </div>
          </div>
        </div>
      </div>
      <div className="relative py-6 border-b-2 border-accent">
        {/* {currentBids?.txid && currentBids?.feeRate && (
          <a href={`https://mempool.space/tx/${currentBids?.txid}`} target="#">
            <p className="text-center mb-6 py-2 bg-secondary">
              Active Bid at {currentBids?.feeRate}sats/vB Fee rate in mempool
            </p>
          </a>
        )} */}
        {walletDetails?.ordinal !== data?.address && (
          <div className="center w-full">
            {/* <BuyInscription data={data} loading={loading} /> */}
            {/* <div className="w-full md:w-6/12 pl-3">
              <AddPadding />
            </div> */}
          </div>
        )}
        {/* <ListInscription data={data} /> */}
      </div>
      <div className="pt-2">
        <DisplayProperties data={data} />
      </div>
    </div>
  );
}

export default InscriptionDetail;
