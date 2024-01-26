"use client";
import { IInscription } from "@/types";
import React from "react";
import Content from "./Content";
import InscriptionDetail from "./InscriptionDetail";
import CardContent from "@/components/elements/CustomCardSmall/CardContent";
import Link from "next/link";
import {
  CustomLeftArrow,
  CustomRightArrow,
} from "@/components/elements/Arrows";
import Slider from "react-slick";
type SearchDetailProps = {
  data: IInscription;
};
function SearchDetailPage({ data }: SearchDetailProps) {
  const settings = {
    dots: false,
    infinite: false,
    arrows: true,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 4,
    autoplay: true,
    autoplaySpeed: 3000,
    loop: true,
    prevArrow: <CustomLeftArrow skip={4} />,
    nextArrow: <CustomRightArrow skip={4} />,
    // adaptiveHeight: true,
    className: "items-stretch",
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
        breakpoint: 900, // additional breakpoint
        settings: {
          slidesToShow: 2,
          slidesToScroll: 2,
          prevArrow: <CustomLeftArrow skip={2} />,
          nextArrow: <CustomRightArrow skip={2} />,
        },
      },

      {
        breakpoint: 500, // small screen breakpoint
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
    <>
      {" "}
      <div className="w-full my-2 text-xs py-2 uppercase font-bold text-white text-center">
        <p
          className={`text-red-400 bg-red-100  py-2 w-full border-accent border rounded tracking-widest font-bold`}
        >
          Users are responsible for their transactions.
        </p>
      </div>
      <div className="min-h-[40vh] py-16 flex justify-center flex-wrap">
        <Content data={data} />
        <InscriptionDetail data={data} />
      </div>
      <>
        {data?.reinscriptions && data?.reinscriptions.length > 0 ? (
          <div className="w-full">
            <h4 className="text-3xl font-extrabold text-white pb-6">
              Reinscriptions On This SAT
            </h4>

            <Slider {...settings} className="flex w-full justify-start">
              {data.reinscriptions.map((i) => (
                <div
                  key={i.inscription_id}
                  className={`relative w-full cursor-pointer p-2 items-stretch h-full`}
                >
                  <Link href={`/inscription/${i.inscription_id}`}>
                    <div
                      className={`border xl:border-2 border-accent  rounded-xl shadow-xl $ bg-secondary`}
                    >
                      <div className="content-div h-[60%] rounded overflow-hidden relative cursor-pointer">
                        <CardContent
                          inscriptionId={i.inscription_id}
                          content_type={i.content_type}
                          inscription={i}
                          className="w-[400px] h-[400px]"
                        />
                        <Link
                          href={`/inscription/${i.inscription_id}`}
                          className="absolute top-0 bottom-0 right-0 left-0"
                        ></Link>
                      </div>
                      <div className={`h-[40%] flex flex-col justify-end px-3`}>
                        <div className="py-2  w-full">
                          <div className="flex-1 flex items-center justify-between w-full">
                            <h5 className=" text-sm font-bold tracking-tight text-white">
                              #{i.inscription_number}
                            </h5>
                            {i &&
                              i?.collection_item_name &&
                              i?.official_collection && (
                                <Link
                                  href={`/collection/${i?.official_collection?.slug}`}
                                >
                                  <span className="bg-yellow-500 rounded-md text-center text-xs py-1 px-3 font-bold text-yellow-900">
                                    {i.collection_item_name}
                                  </span>
                                </Link>
                              )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </Slider>
          </div>
        ) : (
          <></>
        )}
      </>
    </>
  );
}

export default SearchDetailPage;
