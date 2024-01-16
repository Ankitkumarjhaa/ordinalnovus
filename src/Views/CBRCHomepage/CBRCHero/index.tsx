import React from "react";
import Slider from "react-slick";
import { FaTwitter, FaDiscord, FaGlobe } from "react-icons/fa";
import { SlGlobe } from "react-icons/sl";
import { ICollection } from "@/types";
import CardContent from "@/components/elements/CustomCardSmall/CardContent";
import Link from "next/link";
import { FaXTwitter } from "react-icons/fa6";
import CustomButton from "@/components/elements/CustomButton";

const CbrcHero = ({ data }: { data: ICollection[] }) => {
  const settings = {
    dots: true,
    arrows: false,
    infinite: true,
    slidesToShow: 1,
    slidesToScroll: 1,
    initialSlide: 0,
    autoplay: true,
    autoplaySpeed: 3000,
    loop: true,
    speed: 500,
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
    <div className="pt-6 lg:pt-0">
      <div>
        <Slider {...settings}>
          {data.map((item: ICollection, index) => (
            <div key={index} className="rounded-md h-auto">
              <div className="w-full flex flex-wrap justify-between py-6 px-8 rounded-md h-full border border-accent">
                <div className="lg:w-4/12  w-full h-auto p-6">
                  {item.icon ? (
                    <div className="w-full md:flex md:justify-center lg:justify-start rounded-md lg:w-[80%]  max-h-[300px] h-[250px] xl:h-[300px]  overflow-hidden relative ">
                      <img className="rounded-md" src={item.icon} />
                    </div>
                  ) : (
                    <>
                      {item?.inscription_icon?.inscription_id && (
                        <div className="w-full md:flex md:justify-center lg:justify-start rounded-md lg:w-[80%]  max-h-[300px] h-[250px] xl:h-[300px]  overflow-hidden relative ">
                          <CardContent
                            inscriptionId={item.inscription_icon.inscription_id}
                            content_type={item.inscription_icon.content_type}
                            inscription={item.inscription_icon}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="lg:w-8/12 w-full lg:pt-6">
                  <div>
                    <p className=" text-3xl lg:text-5xl font-bold text-white">
                      {item.name}
                    </p>
                    <p className="text-lg lg:text-lg pt-6 font-light">
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
                      <CustomButton
                        bgColor="bg-accent"
                        hoverBgColor="hover:bg-accent_dark"
                        href={`/collection/${item.slug}`}
                        link={true}
                        text="View collection"
                      />
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
