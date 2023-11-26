"use client";
import {
  CustomLeftArrow,
  CustomRightArrow,
} from "@/components/elements/Arrows";
import React from "react";
import Slider from "react-slick";
import { IInscription } from "@/types";
import ListingCard from "./ListingCard";
type ListedInscriptionsProps = {
  data: IInscription[];
};
function Listed({ data }: ListedInscriptionsProps) {
  const settings = {
    dots: false,
    infinite: false,
    arrows: true,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    loop: true,
    prevArrow: <CustomLeftArrow />,
    nextArrow: <CustomRightArrow />,
    responsive: [
      {
        breakpoint: 1300, // tablet breakpoint
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 768, // additional breakpoint
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },

      {
        breakpoint: 640, // small screen breakpoint
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  return (
    <section className="pt-16 w-full">
      <div>
        <h2 className="font-bold text-2xl lg:text-4xl text-white pb-6">
          Listed
        </h2>
      </div>
      <Slider {...settings}>
        {data?.map((item: IInscription) => (
          <div key={item.inscription_id} className="w-full">
            <ListingCard
              inscription={item}
              number={item.inscription_number}
              key={item.inscription_id}
              inscriptionId={item.inscription_id}
              content_type={item.content_type}
              className="h-[300px]"
            />
          </div>
        ))}
      </Slider>
    </section>
  );
}

export default Listed;
