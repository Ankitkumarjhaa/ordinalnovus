"use client";
import {
  CustomLeftArrow,
  CustomRightArrow,
} from "@/components/elements/Arrows";
import React, { useEffect, useState } from "react";
import Slider from "react-slick";
import CBRCCard from "@/components/elements/CBRCCard";
import CustomButton from "@/components/elements/CustomButton";
import { FetchCBRC } from "@/apiHelper/getCBRC";
import { addNotification } from "@/stores/reducers/notificationReducer";
import { useDispatch } from "react-redux";
import { Icbrc } from "@/types/CBRC";
import { CircularProgress } from "@mui/material";

function CBRC() {
  const dispatch = useDispatch();
  const [data, setData] = useState<Icbrc[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  const [sort, setSort] = useState<string>("creation:1");

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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const result = await FetchCBRC({
        offset: page - 1,
        mode: "deploy",
        sort,
      });

      if (result && result.error) {
        dispatch(
          addNotification({
            id: new Date().valueOf(),
            severity: "error",
            message: result.error,
            open: true,
          })
        );
      } else if (result && result.data) {
        setData(result.data.items);
        setTotalCount(result.data.count);
        setLoading(false);
      }
    };

    fetchData();
  }, [sort, page, dispatch]);

  return (
    <section className="pt-16 w-full">
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-2xl lg:text-4xl text-white pb-6">CBRC</h2>
        <div>
          <CustomButton
            link={true}
            text="View All"
            href="/cbrc-20"
            hoverBgColor="hover:bg-accent_dark"
            hoverTextColor="text-white"
            bgColor="bg-accent"
            textColor="text-white"
            className="flex transition-all"
          />
        </div>
      </div>
      {loading ? (
        <div className="text-white min-h-[30vh] center">
          <CircularProgress size={20} />
        </div>
      ) : (
        <Slider {...settings}>
          {data?.map((item: Icbrc) => (
            <div key={item.op.id} className="w-full">
              <CBRCCard
                inscription={item}
                key={item.op.id}
                inscriptionId={item.op.id}
                content_type={item.op.ctype}
              />
            </div>
          ))}
        </Slider>
      )}
    </section>
  );
}

export default CBRC;
