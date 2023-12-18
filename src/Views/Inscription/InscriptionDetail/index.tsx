"use client";

import copy from "copy-to-clipboard";
import { useDispatch } from "react-redux";
import { addNotification } from "@/stores/reducers/notificationReducer";
import { IInscription } from "@/types";
import React, { useState } from "react";
import { AiFillCheckCircle } from "react-icons/ai";
import { BsFillShareFill } from "react-icons/bs";
import { TfiReload } from "react-icons/tfi";
import DisplayProperties from "./DisplayProperties";
import { useRouter } from "next/navigation";
import Link from "next/link";
import moment from "moment";
import { useWalletAddress } from "bitcoin-wallet-adapter";
import ListInscription from "./ListInscription";
import BuyInscription from "./BuyInscription";
import DisplayAttributes from "./DisplayAttributes";
type InscriptionProps = {
  data: IInscription;
};
function InscriptionDetail({ data }: InscriptionProps) {
  const router = useRouter();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const WalletDetail = useWalletAddress();

  return (
    <div className="p-6 md:pt-0 pb-6 flex-1">
      <div className="pb-2 border-b xl:border-b-2 border-accent">
        <div className="relative">
          <h3 className="text-3xl font-extrabold text-white">
            Inscription {data?.inscription_number}
            {data?.version && (
              <span className="text-sm bg-bitcoin rounded-full ml-2 p-1 text-yellow-900">
                V{data.version}
              </span>
            )}
          </h3>
          {data?.parsed_metaprotocol &&
            data?.parsed_metaprotocol.length === 3 && (
              <Link
                href={`/cbrc-20/${data.parsed_metaprotocol[2].split("=")[0]}`}
              >
                <div className="hidden md:block md:absolute top-0 right-0 ml-2">
                  <div className="bg-bitcoin text-yellow-900 px-4 py-1 text-xs font-bold uppercase rounded-lg center">
                    {/* <FaFlag className="text-white " /> */}
                    {data.parsed_metaprotocol[2].split("=")[0] === "B0RD"
                      ? "FAKE BORD"
                      : data.parsed_metaprotocol[2].split("=")[0]}
                  </div>
                </div>
              </Link>
            )}
        </div>
        {data?.official_collection && (
          <Link shallow href={`/collection/${data?.official_collection?.slug}`}>
            <p className="capitalize pb-1 flex items-baseline hover:underline">
              {data?.collection_item_name}
              {"  #"}
              {data?.collection_item_number}
              {data?.official_collection?.verified && (
                <AiFillCheckCircle className="ml-2 text-yellow-500" />
              )}
            </p>
          </Link>
        )}
        <div className="flex justify-between items-center">
          <p className="text-gray-300 text-xs">
            {moment(data.timestamp).format("MMMM Do YYYY, h:mm:ss a")}
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
      <div className="relative">
        {/* TODO: Add BUY/ SELL/ ADD PADDING */}
        {WalletDetail?.connected &&
          WalletDetail.ordinal_address === data.address &&
          data.parsed_metaprotocol?.includes("cbrc-20") &&
          data?.cbrc_valid && <ListInscription data={data} />}
        {((WalletDetail && WalletDetail.ordinal_address !== data.address) ||
          !WalletDetail) &&
          data.listed && <BuyInscription data={data} />}
      </div>
      <div className="pt-2">
        <DisplayProperties data={data} />
      </div>
      {data?.attributes && data?.attributes?.length > 0 && (
        <div className="pt-2">
          <DisplayAttributes data={data} />
        </div>
      )}
    </div>
  );
}

export default InscriptionDetail;
