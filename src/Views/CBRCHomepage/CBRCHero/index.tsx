import React from "react";
import Slider from "react-slick";
import { FaTwitter, FaDiscord } from "react-icons/fa";
import { SlGlobe } from "react-icons/sl";

const CbrcHero = () => {
  const settings = {
    dots: true,
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
          <div className=" rounded-md h-auto lg:h-[45vh] ">
            <div className="w-full flex flex-wrap justify-between  py-6  px-8  rounded-md h-full border border-accent">
              <div className="lg:w-4/12 w-full h-full ">
                <div className="w-full lg:w-[80%] h-full overflow-hidden">
                  <img
                    className="w-full h-full object-cover overflow-hidden rounded-md"
                    src="/assets/images/motoracer.png"
                  />
                </div>
              </div>
              <div className="lg:w-8/12  w-full  lg:pt-0 pt-4">
                <div className="text-2xl lg:text-3xl xl:text-4xl ">
                  <p className="pb-4 border-b border-b-accent border-opacity-30 w-full lg:w-[90%]  2xl:w-[60%]  ">
                    Now Available On Ordinal Novus.
                  </p>
                </div>
                <div className="pt-6">
                  <p className="text-5xl font-bold text-white">Motoracer</p>
                  <p className="text-lg pt-2 font-light">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                    do eiusmod tempor incididunt ut labore et dolore magna
                    aliqua. Ut enim veniam, quis nostrud exercitation ullamco
                    laboris nisi ut aliquip ex ea commodo consequat.
                  </p>
                </div>
                <div className="flex text-3xl pt-6 xl:pt-20 ">
                  <div>
                    <FaTwitter />
                  </div>
                  <div className="px-6">
                    <FaDiscord />
                  </div>
                  <div>
                    <SlGlobe />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Slider>
      </div>
    </div>
  );
};

export default CbrcHero;
