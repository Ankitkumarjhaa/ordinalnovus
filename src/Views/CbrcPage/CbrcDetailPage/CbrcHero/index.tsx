"use client";
import React from "react";
import { ICbrcToken } from "@/types/CBRC";
import { formatNumber } from "@/utils";
import { useSelector } from "react-redux";
import { RootState } from "@/stores";
type HeroProps = {
  data: ICbrcToken;
};
function Hero({ data }: HeroProps) {
  const btcPrice = useSelector(
    (state: RootState) => state.general.btc_price_in_dollar
  );
  return (
    <div className="relative h-auto lg:h-[50vh] 2xl:max-h-96 rounded-xl overflow-hidden border xl:border-2 border-accent bg-secondary">
      <div className="flex justify-between items-start flex-wrap h-full w-full p-6">
        <div className="w-full md:w-4/12">
          <div className="bg-gray-700 rounded-lg text-secondary center h-[300px] uppercase text-3xl font-bold w-[300px] ">
            <span>{data.tick}</span>
          </div>
        </div>
        <div className=" w-full md:w-8/12 p-6 h-full">
          <div className="detailPanel w-full">
            <h1 className="text-white text-xl md:text-3xl font-bold uppercase flex items-start">
              {data.tick}
            </h1>
            <p className="text-light_gray mt-2 text-sm">
              {`${
                data.tick
              } is a CBRC-20 Token on BTC Blockchain with a supply of ${formatNumber(
                data.max
              )}`}
            </p>
          </div>
          {/* <div className="w-full my-2 text-xs py-2 uppercase font-bold text-white text-center">
            <p
              className={`text-bitcoin bg-bitcoin bg-opacity-20  py-2 w-ful rounded tracking-widest font-bold`}
            >
              DATA might be inaccurate and lagging
            </p>
          </div> */}

          <div className="flex flex-wrap w-full items-center justify-start py-3">
            <div className="w-full md:w-6/12 lg:w-4/12 p-2">
              <div className=" p-2 rounded border border-gray-300 flex justify-between">
                <span>Supply</span>
                <span>{formatNumber(data.supply)}</span>
              </div>
            </div>
            <div className="w-full md:w-6/12 lg:w-4/12 p-2">
              <div className="p-2 rounded border border-gray-300 flex justify-between">
                <span>Price</span>
                <span>
                  {data?.price
                    ? "$ " + ((data?.price / 100_000_000) * btcPrice).toFixed(2)
                    : 0}
                </span>
              </div>
            </div>
            <div className="w-full md:w-6/12 lg:w-4/12 p-2">
              <div className="p-2 rounded border border-gray-300 flex justify-between">
                <span>Marketcap</span>
                <span>
                  {data?.price
                    ? "$ " +
                      formatNumber(
                        (data?.price / 100_000_000) * btcPrice * data.supply
                      )
                    : 0}
                </span>
              </div>
            </div>
            <div className="w-full md:w-6/12 lg:w-4/12 p-2">
              <div className="p-2 rounded border border-gray-300 flex justify-between">
                <span>Pending</span>
                <span>{data?.in_mempool}</span>
              </div>
            </div>
            <div className="w-full md:w-6/12 lg:w-4/12 p-2">
              <div className="p-2 rounded border border-gray-300 flex justify-between">
                <span>Listings</span>
                <span>{data?.listed}</span>
              </div>
            </div>
            <div className="w-full md:w-6/12 lg:w-4/12 p-2">
              <div className="p-2 rounded border border-gray-300 flex justify-between">
                <span>Volume</span>
                <span>
                  ${" "}
                  {formatNumber(
                    Number(
                      ((data?.volume / 100_000_000) * btcPrice)?.toFixed(3)
                    )
                  )}
                </span>
              </div>
            </div>
            <div className="w-full md:w-6/12 lg:w-4/12 p-2">
              <div className="p-2 rounded border border-gray-300 flex justify-between">
                <span>Checksum</span>
                <span>{data?.checksum}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Hero;
