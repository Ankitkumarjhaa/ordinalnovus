import React from "react";
import Slider from "react-slick";
import { FaTwitter, FaDiscord, FaGlobe } from "react-icons/fa";
import { SlGlobe } from "react-icons/sl";
import { ICollection } from "@/types";
import CardContent from "@/components/elements/CustomCardSmall/CardContent";
import Link from "next/link";
import { FaXTwitter } from "react-icons/fa6";

const CbrcHero = ({ data }: { data: ICollection[] }) => {
  const settings = {
    dots: true,
    arrows: false,
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    initialSlide: 0,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          infinite: true,
          dots: true,
        },
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          initialSlide: 1,
        },
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };
  return (
    <div>
      <div>
        <Slider {...settings}>
          {data.map((item, index) => (
            <div key={index} className="rounded-md h-auto lg:h-[45vh]">
              <div className="w-full flex flex-wrap justify-between py-6 px-8 rounded-md h-full border border-accent">
                <div className="lg:w-4/12 w-full h-full">
                  {item?.inscription_icon?.inscription_id ? (
                    <div className="w-full rounded-md lg:w-[80%] h-full overflow-hidden">
                      <CardContent
                        inscriptionId={item.inscription_icon.inscription_id}
                        content_type={item.inscription_icon.content_type}
                        inscription={item.inscription_icon}
                      />
                    </div>
                  ) : (
                    <div className="w-full  rounded-md lg:w-[80%] h-full overflow-hidden">
                      <img src={item.icon} />
                    </div>
                  )}
                </div>
                <div className="lg:w-8/12 w-full lg:pt-0 pt-4">
                  <div>
                    <p className="text-5xl font-bold text-white">{item.name}</p>
                    <p className="text-lg pt-3 font-light">
                      {item.description}
                    </p>
                  </div>
                  <div className="flex text-3xl pt-6 space-x-4 xl:pt-20">
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
                  <div>
                    <div className="pt-8  ">
                      <Link
                        href={`/collection/${item.slug}`}
                        shallow
                        prefetch={false}
                      >
                        <button className="bg-violet rounded-md  px-4 py-4 text-md text-white">
                          View Collection
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </Slider>
      </div>
    </div>
  );
};

export default CbrcHero;
