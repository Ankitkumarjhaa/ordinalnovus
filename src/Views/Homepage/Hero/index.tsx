"use client";
import { ICollection } from "@/types";
import React from "react";
import Slider from "react-slick";
import HeroCard from "./HeroCard";
type HeroProps = {
  data: ICollection[];
};
function Hero({ data }: HeroProps) {
  const settings = {
    dots: false,
    infinite: false,
    arrows: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    loop: true,
  };

  return (
    <section>
      <Slider {...settings}>
        {data.map((item) => (
          <HeroCard key={item.slug} item={item} />
        ))}
      </Slider>
    </section>
  );
}

export default Hero;
