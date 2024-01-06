import { IStats } from "@/types";
import { IHistoricalData, IToken } from "@/types/CBRC";
import React from "react";
import { BiSolidUpArrow, BiSolidDownArrow } from "react-icons/bi";

const Trending = ({ data }: { data: IToken[] }) => {
  const calculateVolumeChange = (historicalData: IHistoricalData[]) => {
    if (!historicalData || historicalData.length < 2) {
      return { value: "N/A", isPositive: false }; // Not enough data
    }
  
    const latestVolume = historicalData[0]?.volume ;
    const previousVolume = historicalData[1]?.volume ;

    if (previousVolume === 0) {
      return {
        value: latestVolume === 0 ? "0%" : "Infinity",
        isPositive: latestVolume !== 0,
      };
    }

    const change = latestVolume - previousVolume;
    const percentageChange = (change / previousVolume) * 100;

    return {
      value: `${percentageChange.toFixed(2)}%`,
      isPositive: percentageChange > 0,
    };
  };

  return (
    <div className="py-8 px-6 rounded-lg bg-violet">
      <div className="flex items-center pb-4">
        <div>
          <img src="/assets/images/trending.png" />
        </div>
        <div>
          <p className="font-semibold text-xl text-white pl-2 ">Trending</p>
        </div>
      </div>
      {data.slice(0, 3).map((item, index) => {
        const { value, isPositive } = calculateVolumeChange(
          item.historicalData
        );
        return (
          <div key={index} className=" p-3  flex justify-between items-center">
            <div className="text-light_gray text-md">
              {index + 1}. <span className="pl-1 uppercase text-white font-medium"> {item.tick}</span>
            </div>
            <div
              className={` ${
                isPositive ? "text-green-500" : "text-red-500"
              } flex items-center  `}
            >
              {isPositive ? <BiSolidUpArrow /> : <BiSolidDownArrow />}
              <span className="pl-2">{value}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Trending;
