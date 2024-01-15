"use client";
import { ICollection } from "@/types";
import React from "react";
import { AiFillCheckCircle } from "react-icons/ai";
import { FaDiscord, FaGlobe } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import CardContent from "@/components/elements/CustomCardSmall/CardContent";
import mixpanel from "mixpanel-browser";
type HeroProps = {
  data: ICollection;
};
function Hero({ data }: HeroProps) {
  function handleSocialClick(platform: string, url: string) {
    mixpanel.track("Social Media Click", {
      referrer: document.referrer,
      platform: platform,
      url,
      collection: data.name, // Additional properties
    });
  }

  return (
    <div className="relative h-auto lg:h-[50vh] 2xl:max-h-96 rounded-xl overflow-hidden border xl:border-2 border-accent bg-secondary">
      <div className="flex justify-between items-start flex-wrap h-full w-full p-6">
        <div className="w-full lg:w-4/12 h-full flex justify-center lg:justify-start items-center">
          {data?.inscription_icon?.inscription_id ? (
            <div className="max-w-[300px] max-h-[300px] w-[250px] h-[250px] xl:w-[300px] xl:h-[300px]  relative rounded-2xl overflow-hidden">
              <CardContent
                inscriptionId={data.inscription_icon.inscription_id}
                content_type={data.inscription_icon.content_type}
                inscription={data.inscription_icon}
              />
            </div>
          ) : (
            <div className="max-w-[300px] max-h-[300px] w-[250px] h-[250px] xl:w-[300px] xl:h-[300px]  relative rounded-2xl overflow-hidden">
              <img src={data.icon} />
            </div>
          )}
        </div>
        <div className=" w-full lg:w-8/12 p-6 flex flex-wrap justify-center relative h-full">
          <div className="detailPanel w-full md:w-8/12 md:pr-6">
            <h1 className="text-white text-xl md:text-3xl font-bold uppercase flex items-start">
              {data.name}
              {data.verified && (
                <AiFillCheckCircle className="ml-2 text-yellow-500" />
              )}
              {/* <div className="md:absolute top-0 right-0 ml-2">
                <div className="bg-accent w-[30px] h-[30px] rounded-lg center p-1">
                  <FaFlag className="text-white " />
                </div>
              </div> */}
            </h1>
            <p className="text-light_gray mt-2 text-sm">
              {" "}
              {data.description.length > 150
                ? data.description.slice(0, 150) + "..."
                : data.description}
            </p>
            <div className="flex mt-4 space-x-4">
              {data.twitter_link && (
                <a
                  href={data.twitter_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    handleSocialClick("x", data.twitter_link || "")
                  }
                >
                  <FaXTwitter size={24} color="white" />
                </a>
              )}
              {data.discord_link && (
                <a
                  href={data.discord_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    handleSocialClick("discord", data.discord_link || "")
                  }
                >
                  <FaDiscord size={24} color="white" />
                </a>
              )}
              {data.website_link && (
                <a
                  href={data.website_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-platform="Website"
                  onClick={() =>
                    handleSocialClick("website", data.website_link || "")
                  }
                >
                  <FaGlobe size={24} color="white" />
                </a>
              )}
            </div>
          </div>
          <div className="sidePanel w-full md:w-4/12 md:border-l border-accent py-6 md:p-3 overflow-y-auto overflow-x-hidden no-scrollbar max-h-full ">
            {data?.tags && data.tags.length > 0 && (
              <div className="tags flex items-center justify-start text-xs">
                {data?.tags?.map((item, idx) => {
                  if (idx < 2 && !item.includes(";"))
                    return (
                      <span key={item} className="pr-3 py-3">
                        <span className="bg-accent border text-xs font-bold border-white px-4 py-2 rounded leading-1 text-white uppercase ">
                          {item}
                        </span>
                      </span>
                    );
                })}
              </div>
            )}
            <div className="supply bg-primary-dark px-3 py-1 rounded-lg my-3 md:m-3 text-sm md:ml-0 w-full flex justify-between items-center">
              <span>Supply</span>
              <span className="text-white">{data.supply}</span>
            </div>

            {data?.royalty_bp && data?.royalty_bp > 0 ? (
              <div className="supply bg-primary-dark px-3 py-1 rounded-lg my-3 md:m-3 text-sm md:ml-0 w-full flex justify-between items-center">
                <span>Royalty</span>
                <span className="text-white">
                  {(data.royalty_bp / 100).toFixed(2)} %
                </span>
              </div>
            ) : (
              <></>
            )}
            {data?.max && data.max > 0 ? (
              <div className="supply bg-primary-dark px-3 py-1 rounded-lg my-3 md:m-3 text-sm md:ml-0 w-full flex justify-between items-center">
                <span>Max</span>
                <span className="text-white">{data.max}</span>
              </div>
            ) : (
              <></>
            )}
            {data?.min && !isNaN(data?.min) ? (
              <div className="supply bg-primary-dark px-3 py-1 rounded-lg my-3 md:m-3 text-sm md:ml-0 w-full flex justify-between items-center">
                <span>Min</span>
                <span className="text-white">{data.min}</span>
              </div>
            ) : (
              <></>
            )}
            {/* {data?.holders && (
              <div className="supply bg-primary-dark px-3 py-1 rounded-lg my-3 md:m-3 text-sm md:ml-0 w-full flex justify-between items-center">
                <span>Holders</span>
                <span className="text-white">{data.holders_count}</span>
              </div>
            )} */}
            {(data?.listed || -10) > 0 && (
              <div className="supply bg-primary-dark px-3 py-1 rounded-lg my-3 md:m-3 text-sm md:ml-0 w-full flex justify-between items-center">
                <span>Listed</span>
                <span className="text-white">{data.listed}</span>
              </div>
            )}
            {/* {data.fp !== undefined && !isNaN(data.fp) && data.fp > 0 && (
              <div className="supply bg-primary-dark px-3 py-1 rounded-lg my-3 md:m-3 text-sm md:ml-0 w-full flex justify-between items-center">
                <span>FP</span>
                <span className="text-white">{data.fp / 100_000_000} BTC</span>
              </div>
            )} */}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Hero;
