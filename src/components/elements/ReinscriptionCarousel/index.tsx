import React from "react";
import { CustomLeftArrow, CustomRightArrow } from "../Arrows";
import Slider from "react-slick";
import { IInscription } from "@/types";
import CardContent from "../CustomCardSmall/CardContent";

function ReinscriptionCarousel({ data }: { data: IInscription[] }) {
  const settings = {
    dots: false,
    infinite: false,
    arrows: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: false,
    autoplaySpeed: 3000,
    loop: true,
    prevArrow: <CustomLeftArrow skip={6} />,
    nextArrow: <CustomRightArrow skip={6} />,
  };

  return (
    <div className="">
      <Slider {...settings}>
        {data?.map((item: IInscription) => (
          <div key={item.inscription_id} className="w-full relative">
            <CardContent
              inscriptionId={item.inscription_id}
              content_type={item.content_type}
              inscription={item}
            />
            {item.collection_item_name && item.collection_item_number && (
              <div className="absolute bottom-0 p-2 left-0">
                <p className="bg-secondary px-2 py-1">
                  {item.collection_item_name} #{item.collection_item_number}
                </p>
              </div>
            )}
            {item.inscription_number && (
              <div className="absolute bottom-0 right-0 p-2">
                <p className="bg-secondary px-2 py-1">
                  #{item.inscription_number}
                </p>
              </div>
            )}
          </div>
        ))}
      </Slider>
    </div>
  );
}

export default ReinscriptionCarousel;
