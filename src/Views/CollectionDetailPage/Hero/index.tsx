"use client";
import { ICollection } from "@/types/Ordinals";
import React from "react";
import { AiFillCheckCircle } from "react-icons/ai";
import { FaDiscord, FaFlag, FaGlobe, FaTwitter } from "react-icons/fa";
import CardContent from "@/components/elements/CustomCardSmall/CardContent";
type HeroProps = {
  data: ICollection;
};
function Hero({ data }: HeroProps) {
  return (
    <div className="relative h-auto lg:h-[60vh] 2xl:max-h-96 rounded-xl overflow-hidden border xl:border-2 border-accent bg-secondary">
      <div className="flex justify-between items-start flex-wrap h-full w-full p-6">
        <div className="w-full lg:w-4/12 h-full flex justify-center lg:justify-start items-center">
          <div className="max-w-[300px] max-h-[300px] w-[250px] h-[250px] xl:w-[300px] xl:h-[300px]  relative rounded-2xl overflow-hidden">
            <CardContent
              inscriptionId={data.inscription_icon.inscription_id + ""}
              content_type={data.inscription_icon.content_type}
            />
          </div>
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
                >
                  <FaTwitter size={24} color="white" />
                </a>
              )}
              {data.discord_link && (
                <a
                  href={data.discord_link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaDiscord size={24} color="white" />
                </a>
              )}
              {data.website_link && (
                <a
                  href={data.website_link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaGlobe size={24} color="white" />
                </a>
              )}
            </div>
          </div>
          <div className="sidePanel w-full md:w-4/12 md:border-l border-accent py-6 md:p-3">
            {data.tags.length > 0 && (
              <div className="tags flex items-center justify-start text-xs">
                {data?.tags?.map((item, idx) => {
                  if (idx < 2)
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
            {data?.max && (
              <div className="supply bg-primary-dark px-3 py-1 rounded-lg my-3 md:m-3 text-sm md:ml-0 w-full flex justify-between items-center">
                <span>Max</span>
                <span className="text-white">{data.max}</span>
              </div>
            )}
            {data?.min && (
              <div className="supply bg-primary-dark px-3 py-1 rounded-lg my-3 md:m-3 text-sm md:ml-0 w-full flex justify-between items-center">
                <span>Min</span>
                <span className="text-white">{data.min}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Hero;
