"use client";
import React, { useEffect } from "react";
import { AiFillCheckCircle } from "react-icons/ai";
import { FaDiscord, FaGlobe } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import CardContent from "@/components/elements/CustomCardSmall/CardContent";
import mixpanel from "mixpanel-browser";
import { Icbrc } from "@/types/CBRC";
type HeroProps = {
  data: Icbrc;
};
function Hero({ data }: HeroProps) {
  //   function handleSocialClick(platform: string, url: string) {
  //     mixpanel.track("Social Media Click", {
  //       referrer: document.referrer,
  //       platform: platform,
  //       url,
  //       collection: data.name, // Additional properties
  //     });
  //   }

  return (
    <div className="relative h-auto lg:h-[50vh] 2xl:max-h-96 rounded-xl overflow-hidden border xl:border-2 border-accent bg-secondary">
      <div className="flex justify-between items-start flex-wrap h-full w-full p-6">
        <div className="w-full lg:w-4/12 h-full flex justify-center lg:justify-start items-center">
          <div className="max-w-[300px] max-h-[300px] w-[250px] h-[250px] xl:w-[300px] xl:h-[300px]  relative rounded-2xl overflow-hidden">
            <CardContent
              inscriptionId={data.op.id}
              content_type={data.op.ctype}
            />
          </div>
        </div>
        <div className=" w-full lg:w-8/12 p-6 flex flex-wrap justify-center relative h-full">
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
              <span>Max</span>
              <span className="text-white">{data.max}</span>
            </div>
            <div className="supply bg-primary-dark px-3 py-1 rounded-lg my-3 md:m-3 text-sm md:ml-0 w-full flex justify-between items-center">
              <span>Supply</span>
              <span className="text-white">{data.supply}</span>
            </div>
            <div className="supply bg-primary-dark px-3 py-1 rounded-lg my-3 md:m-3 text-sm md:ml-0 w-full flex justify-between items-center">
              <span>Minted</span>
              <span className="text-white">
                {" "}
                {((data.supply / data.max) * 100).toFixed(3)}%
              </span>
            </div>
            <div className="supply bg-primary-dark px-3 py-1 rounded-lg my-3 md:m-3 text-sm md:ml-0 w-full flex justify-between items-center">
              <span>Holders</span>
              <span className="text-white"> {data.op.h}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Hero;
