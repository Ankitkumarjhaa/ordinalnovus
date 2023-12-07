"use client";
import {
  CustomLeftArrow,
  CustomRightArrow,
} from "@/components/elements/Arrows";
import { RecentInscription } from "@/types";
import React from "react";
import Slider from "react-slick";
import CustomCard from "@/components/elements/CustomCardSmall";
type RecentlyInscribedProps = {
  data: RecentInscription[];
};
function Recent({ data }: RecentlyInscribedProps) {
  const settings = {
    dots: false,
    infinite: false,
    arrows: true,
    speed: 500,
    slidesToShow: 6,
    slidesToScroll: 6,
    autoplay: true,
    autoplaySpeed: 3000,
    loop: true,
    prevArrow: <CustomLeftArrow skip={6} />,
    nextArrow: <CustomRightArrow skip={6} />,
    responsive: [
      {
        breakpoint: 1500, // tablet breakpoint
        settings: {
          slidesToShow: 4,
          slidesToScroll: 4,
          prevArrow: <CustomLeftArrow skip={4} />,
          nextArrow: <CustomRightArrow skip={4} />,
        },
      },
      {
        breakpoint: 1300, // tablet breakpoint
        settings: {
          slidesToShow: 3,
          slidesToScroll: 3,
          prevArrow: <CustomLeftArrow skip={3} />,
          nextArrow: <CustomRightArrow skip={3} />,
        },
      },
      {
        breakpoint: 768, // additional breakpoint
        settings: {
          slidesToShow: 2,
          slidesToScroll: 2,
          prevArrow: <CustomLeftArrow skip={2} />,
          nextArrow: <CustomRightArrow skip={2} />,
        },
      },

      {
        breakpoint: 640, // small screen breakpoint
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          prevArrow: <CustomLeftArrow skip={1} />,
          nextArrow: <CustomRightArrow skip={1} />,
        },
      },
    ],
  };

  return (
    <section className="pt-16 w-full">
      <div>
        <h2 className="font-bold text-2xl lg:text-4xl text-white  pb-6">
          Recently Inscribed
        </h2>
      </div>
      <Slider {...settings}>
        {data?.map((item) => (
          <div key={item.inscriptionId} className="w-full">
            <CustomCard
              number={item.number}
              key={item.inscriptionId}
              inscriptionId={item.inscriptionId}
              content_type={item.content_type}
              className="h-[300px]"
            />
          </div>
        ))}
      </Slider>
    </section>
  );
}

export default Recent;
