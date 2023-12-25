"use client";
import React from "react";
import { IToken } from "@/types/CBRC";
import { formatNumber } from "@/utils";
type HeroProps = {
  data: IToken;
};
function Hero({ data }: HeroProps) {
  return (
    <div className="relative h-auto lg:h-[50vh] 2xl:max-h-96 rounded-xl overflow-hidden border xl:border-2 border-accent bg-secondary">
      <div className="flex justify-between items-start flex-wrap h-full w-full p-6">
        <div className=" w-full p-6 flex flex-wrap justify-center relative h-full">
          <div className="detailPanel w-full md:w-8/12 md:pr-6">
            <h1 className="text-white text-xl md:text-3xl font-bold uppercase flex items-start">
              {data.tick}
            </h1>
            <p className="text-light_gray mt-2 text-sm">
              {`${data.tick} is a CBRC-20 Token on BTC Blockchain with a supply of ${data.max}`}
            </p>
          </div>
          <div className="w-full md:w-4/12">
            <div className="supply bg-primary-dark px-3 py-1 rounded-lg my-3 md:m-3 text-sm md:ml-0 w-full flex justify-between items-center">
              <span>Checksum</span>
              <span className="text-white">{data.checksum}</span>
            </div>
            <div className="supply bg-primary-dark px-3 py-1 rounded-lg my-3 md:m-3 text-sm md:ml-0 w-full flex justify-between items-center">
              <span>Max</span>
              <span className="text-white">{formatNumber(data.max)}</span>
            </div>
            <div className="supply bg-primary-dark px-3 py-1 rounded-lg my-3 md:m-3 text-sm md:ml-0 w-full flex justify-between items-center">
              <span>Volume</span>
              <span className="text-white">{data.volume || 0}</span>
            </div>
            <div className="supply bg-primary-dark px-3 py-1 rounded-lg my-3 md:m-3 text-sm md:ml-0 w-full flex justify-between items-center">
              <span>Buy Pending Tx</span>
              <span className="text-white">{data.in_mempool || 0}</span>
            </div>
            <div className="supply bg-primary-dark px-3 py-1 rounded-lg my-3 md:m-3 text-sm md:ml-0 w-full flex justify-between items-center">
              <span>Listed</span>
              <span className="text-white">{data.listed || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Hero;
