import React from "react";
import CustomButton from "@components/elements/CustomButton";

import { FaXTwitter } from "react-icons/fa6";
import { FaDiscord, FaGlobe } from "react-icons/fa";
import { ICollection } from "@/types";
import { AiFillCheckCircle } from "react-icons/ai";
import CardContent from "@/components/elements/CustomCardSmall/CardContent";

interface HeroCardProps {
  item: ICollection;
}

const HeroCard: React.FC<HeroCardProps> = ({ item }) => {
  return (
    <div className="relative h-auto  lg:h-[50vh] 2xl:max-h-96 rounded-xl overflow-hidden border xl:border-2 border-accent bg-secondary">
      <div className="flex justify-between items-start flex-wrap h-full w-full p-6">
        <div className=" w-full lg:w-7/12 p-6 order-2 lg:order-1">
          <h1 className="text-white text-xl xl:text-3xl font-bold uppercase flex items-start">
            {item.name}
            {item.verified && (
              <AiFillCheckCircle className="ml-2 text-yellow-500" />
            )}
          </h1>
          <p className="text-light_gray mt-2 text-sm">
            {item.description.length > 200
              ? item.description.slice(0, 200) + "..."
              : item.description}
          </p>

          <div className="pt-2">
            <CustomButton
              text="View Collection"
              link={true}
              href={`/collection/${item.slug}`}
              hoverBgColor="hover:bg-accent_dark"
              hoverTextColor="text-white"
              bgColor="bg-accent"
              textColor="text-white"
              className="flex transition-all"
            />
          </div>
          <div className="flex mt-4 space-x-4">
            {item.twitter_link && (
              <a
                href={item.twitter_link}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaXTwitter size={24} color="white" />
              </a>
            )}
            {item.discord_link && (
              <a
                href={item.discord_link}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaDiscord size={24} color="white" />
              </a>
            )}
            {item.website_link && (
              <a
                href={item.website_link}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaGlobe size={24} color="white" />
              </a>
            )}
          </div>
        </div>
        {item?.inscription_icon?.inscription_id ? (
          <div className="w-full lg:w-5/12 h-full flex justify-center lg:justify-end items-center order-1 lg:order-2">
            <div className="max-w-[300px] max-h-[300px] w-[250px] xl:w-[300px] h-[250px] xl:h-[300px]  relative rounded-xl overflow-hidden">
              <CardContent
                inscriptionId={item.inscription_icon.inscription_id}
                content_type={item.inscription_icon.content_type}
                inscription={item.inscription_icon}
              />
            </div>
          </div>
        ) : (
          <div>
            <img src={item.icon} />
          </div>
        )}
      </div>
    </div>
  );
};

export default HeroCard;
