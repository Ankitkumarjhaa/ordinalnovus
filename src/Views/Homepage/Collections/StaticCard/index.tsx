import React from "react";
import Image from "next/image";
import Link from "next/link";

interface StaticCardProps {
  item: any;
}

const StaticCard: React.FC<StaticCardProps> = ({ item }) => {
  return (
    <div className="w-full md:w-6/12 lg:w-4/12 px-0 py-3 md:p-3">
      <Link href={`/orderbook?min=${item.min}&max=${item.max}`}>
        <div className="p-3 bg-secondary flex rounded-xl shadow-xl ">
          <div className="w-[50px] h-[50px] relative">
            {item.icon_type === "image" ? (
              <Image
                style={{ imageRendering: "pixelated" }}
                src={`/content/${item.inscription_icon}`}
                alt={item.name}
                fill={true}
                className="relative rounded-xl overflow-hidden max-w-[300px] max-h-[300px] aspect-square"
              />
            ) : item.icon_type === "video" ? (
              <video
                src={`/content/${item.inscription_icon}`}
                className="relative rounded-xl overflow-hidden"
                autoPlay
                muted
                loop
                style={{ objectFit: "cover" }}
                width="100%"
                height="100%"
              />
            ) : (
              <iframe
                src={`/content/${item.inscription_icon}`}
                className="no-scroll-iframe relative rounded-xl h-full"
                scrolling="no"
                width="100%"
                height="100%"
                sandbox="allow-scripts allow-same-origin"
                frameBorder="0"
                title="Iframe"
                allowFullScreen
              />
            )}
          </div>
          <div className="flex-1 p-3">
            <h3 className="text-white text-lg font-bold capitalize flex items-start">
              {item.name}
            </h3>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default StaticCard;
