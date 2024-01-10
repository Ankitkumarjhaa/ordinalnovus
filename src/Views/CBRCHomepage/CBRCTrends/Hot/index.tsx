import { IStats } from "@/types";
import { IHistoricalData, IToken } from "@/types/CBRC";
import React from "react";
import { BiSolidUpArrow, BiSolidDownArrow } from "react-icons/bi";

const Hot = ({ data }: { data: IStats }) => {
  const calculateVolumeChange = (item: IToken) => {
    const currentVolume = item.volume;
    const latestHistoricalVolume = item.historicalData[0]?.volume_sats || 0;
    if (latestHistoricalVolume === 0) {
      return {
        value: currentVolume === 0 ? "0%" : "Infinity",
        isPositive: currentVolume !== 0,
      };
    }

    const change = currentVolume - latestHistoricalVolume;
    const percentageChange = (change / latestHistoricalVolume) * 100;


    return {
      value: `${percentageChange.toFixed(2)}%`,
      isPositive: percentageChange > 0,
    };
  };

  return (
    <div className="py-8 px-6 rounded-lg  bg-violet">
     <div className="pb-4 flex items-center justify-between">
     <div className="flex items-center ">
        <div>
          <img src="/assets/images/hot.png" />
        </div>
        <div>
          <p className="font-semibold text-xl text-white pl-2 ">Hot</p>
        </div>
      </div>
      <div className="text-white ">
        <p>In mempool</p>
      </div>
     </div>
      {data.tokensHot.map((item, index) => {
        const { value, isPositive } = calculateVolumeChange(item);
        return (
          <div key={index} className=" p-3  flex justify-between items-center">
            <div className="text-light_gray text-md">
              {index + 1}.{" "}
              <span className="pl-1 uppercase text-white font-medium">
                {" "}
                {item.tick}
              </span>
            </div>
            <div
              className=""
            >
              <span className="pl-2">{item.in_mempool}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Hot;
