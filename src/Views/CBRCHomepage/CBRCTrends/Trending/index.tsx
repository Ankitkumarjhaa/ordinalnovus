import { RootState } from "@/stores";
import { IStats } from "@/types";
import { formatNumber } from "@/utils";
import React, { useCallback } from "react";
import { FaDollarSign } from "react-icons/fa";
import { useSelector } from "react-redux";

const Trending = ({ data }: { data: IStats }) => {
  const btcPrice = useSelector(
    (state: RootState) => state.general.btc_price_in_dollar
  );

  const convertToUSD = useCallback(
    (sats: number) => {
      if (btcPrice) {
        return formatNumber(
          Number(((sats / 100_000_000) * btcPrice).toFixed(2))
        );
      }
      return "Loading...";
    },
    [btcPrice]
  );

  return (
    <div className="py-8 px-6 rounded-lg bg-violet h-full">
      <div className="flex items-center pb-4">
        <div>
          <img src="/static-assets/images/trending.png" />
        </div>
        <div>
          <p className="font-semibold text-xl text-white pl-2 ">Trending</p>
        </div>
      </div>
      {data.tokensTrend.map((item, index) => {
        return (
          <div key={index} className=" p-3  flex justify-between items-center">
            <div className="text-light_gray text-md">
              {index + 1}.{" "}
              <span className="pl-1 uppercase text-white font-medium">
                {" "}
                {item.tick}
              </span>
            </div>
            <div className="">
              {/* {isPositive ? <BiSolidUpArrow /> : <BiSolidDownArrow />} */}
              <p className="pl-2 flex items-center">
                <FaDollarSign className="text-green-500" />
                <span className="pl-1">{convertToUSD(item.price)}</span>
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Trending;
