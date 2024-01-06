import { formatNumber, getBTCPriceInDollars } from "@/utils";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setBTCPrice } from "@/stores/reducers/generalReducer";
import { RootState } from "@/stores";
import { IStats } from "@/types";


const CBRCStats = ({ stats }: {  stats:IStats }) => {
  const dispatch = useDispatch();

  const btcPrice = useSelector(
    (state: RootState) => state.general.btc_price_in_dollar
  ); // Retrieve BTC price from Redux store
  const fees = useSelector((state: RootState) => state.general.fees); // Retrieve fees from Redux store

 console.log(stats,'stats in statscomponent')

  const convertToUSD = (sats: number) => {
    if (btcPrice) {
      return formatNumber(Number(((sats / 100_000_000) * btcPrice).toFixed(3)));
    }
    return "Loading...";
  };

  return (
    <div className="pb-2">
      {stats ? (
        <div className="flex justify-between border-y  border-y-light_gray items-center h-[50px]">
          <div className="flex">
            <p className="text-gray">Tokens :</p>
            <p className="pl-2 text-bitcoin">{stats.tokens}</p>
          </div>
          <div className="flex">
            <p className="text-gray">24Hr Vol :</p>
            <p className="pl-2 text-bitcoin">{convertToUSD(stats.dailyVolume)}</p>
          </div>
          <div className="flex">
            <p className="text-gray">Monthly Vol :</p>
            <p className="pl-2 text-bitcoin">
              {convertToUSD(stats.monthlyVolume)}
            </p>
          </div>
          <div className="flex">
            <p className="text-gray">All time Vol :</p>
            <p className="pl-2 text-bitcoin">
              {convertToUSD(stats.allTimeVolume)}
            </p>
          </div>
          <div className="flex">
            <p className="text-gray">Fees :</p>
            <p className="pl-2 text-bitcoin">{fees?.fastestFee} sats/vB</p>
          </div>
          <div className="flex">
            <p className="text-gray">BTC :</p>
            <p className="pl-2 text-bitcoin">${btcPrice}</p>
          </div>
          <div className="flex">
            <p className="text-gray">Latest height :</p>
            <p className="pl-2 text-bitcoin">{stats.btcHeight}</p>
          </div>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default CBRCStats;
