"use client";
import {
  CustomLeftArrow,
  CustomRightArrow,
} from "@/components/elements/Arrows";
import React from "react";
import Slider from "react-slick";
import { IInscription } from "@/types";
import ListingCard from "./ListingCard";
import CustomButton from "@/components/elements/CustomButton";
type ListedInscriptionsProps = {
  data: IInscription[];
};
function Listed({ data }: ListedInscriptionsProps) {
  const settings = {
    dots: false,
    infinite: false,
    arrows: true,
    speed: 500,
    slidesToShow: 6,
    slidesToScroll: 6,
    autoplay: false,
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
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-2xl lg:text-4xl text-white pb-6">
          Listed
        </h2>
        <div>
          <CustomButton
            link={true}
            text="View All"
            href="/orderbook"
            hoverBgColor="hover:bg-accent_dark"
            hoverTextColor="text-white"
            bgColor="bg-accent"
            textColor="text-white"
            className="flex transition-all"
          />
        </div>
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
              showCollection={true}
            />
          </div>
        ))}
      </Slider>
    </section>
  );
}

export default Listed;
