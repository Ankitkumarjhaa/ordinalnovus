import React from "react";
const CollectionItemCard = () => {
  return (
    <div className="relative p-3 md:max-w-[300px] md:max-h-[350px] w-full md:w-3/12 2xl:w-2/12 ">
      <div className="border xl:border-2 border-accent bg-secondary rounded-xl shadow-xl p-3">
        <div className="min-h-[300px] md:min-h-[220px] lg:w-full relative rounded-xl overflow-hidden">
          <div className="relative bg-gray-500 animate-pulse rounded-xl overflow-hidden w-full h-full aspect-square"></div>
        </div>
        <div className="p-6 rounded bg-gray-500 animate-pulse mt-2"></div>
      </div>
    </div>
  );
};

export default CollectionItemCard;
