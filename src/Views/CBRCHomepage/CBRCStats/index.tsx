import { formatNumber, getBTCPriceInDollars } from "@/utils";
import axios from "axios";
import React, { useCallback, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setBTCPrice } from "@/stores/reducers/generalReducer";
import { RootState } from "@/stores";
import { IStats } from "@/types";
import { FaDollarSign,FaBitcoin } from "react-icons/fa6";

const CBRCStats = ({ stats }: { stats: IStats }) => {
  const dispatch = useDispatch();

  const btcPrice = useSelector(
    (state: RootState) => state.general.btc_price_in_dollar
  ); // Retrieve BTC price from Redux store
  const fees = useSelector((state: RootState) => state.general.fees); // Retrieve fees from Redux store

  const convertToUSD = useCallback(
    (sats: number) => {
      if (btcPrice) {
        return formatNumber(
          Number(((sats / 100_000_000) * btcPrice).toFixed(3))
        );
      }
      return "Loading...";
    },
    [btcPrice]
  );

  const convertSatsToBTC = useCallback(
    (sats: number, decimalPlaces: number) => {
      // Convert satoshis to BTC with variable decimal places
      return (sats / 100_000_000).toFixed(decimalPlaces);
    },
    [] // No dependencies
  );

  return (
    <div className="pb-2">
      {stats ? (
        <div className="hidden lg:flex justify-between border-y  border-y-light_gray items-center h-[50px]">
          <div className="flex">
            <p className="text-gray">Tokens :</p>
            <p className="pl-2 text-bitcoin">{stats.tokens}</p>
          </div>
          <div className="flex">
            <p className="text-gray">24Hr Vol :</p>
            <p className="pl-2 text-bitcoin flex items-center ">
             <span className="pr-1"><FaBitcoin className="text-bitcoin " /></span> 
              {convertSatsToBTC(stats.dailyVolume,2)}
            </p>
          </div>
          <div className="flex">
            <p className="text-gray">30 Days Vol :</p>
            <p className="pl-2 text-bitcoin flex items-center">
             <span className="pr-1"><FaBitcoin className="text-bitcoin " /></span> 
              {convertSatsToBTC(stats.monthlyVolume,0)}
            </p>
          </div>
          <div className="flex">
            <p className="text-gray">All time Vol :</p>
            <p className="pl-2 text-bitcoin flex items-center">
             <span className="pr-1"><FaBitcoin className="text-bitcoin " /></span> 
              {convertSatsToBTC(stats.allTimeVolume,0)}
            </p>
          </div>
          <div className="flex">
            <p className="text-gray">Fees :</p>
            <p className="pl-2 text-bitcoin">{fees?.fastestFee} sats/vB</p>
          </div>
          <div className="flex">
            <p className="text-gray">BTC :</p>
            <p className="pl-2 text-bitcoin flex items-center">
              <FaDollarSign className="text-green-500" />
              {btcPrice}
            </p>
          </div>
          <div className="flex items-center">
            <p className="text-gray">Latest height : </p>
            <p
              className={`px-2 font-medium text-white rounded-sm py-3 ${
                Math.abs(stats.btcHeight - stats.novusBtcHeight) > 2
                  ? "bg-red-500"
                  : ""
              }`}
            >
              {stats.btcHeight}
            </p>
          </div>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default CBRCStats;
