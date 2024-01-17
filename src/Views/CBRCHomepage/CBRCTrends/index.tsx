import { FetchCBRC } from "@/apiHelper/getCBRC";
import { ICbrcToken } from "@/types/CBRC";
import React, { useEffect, useState } from "react";
import Trending from "./Trending";
import { IStats } from "@/types";
import Hot from "./Hot";
import TrendStats from "./TrendStats";

const CBRCTrends = ({ token }: { token: IStats }) => {
  return (
    <div className="py-3 flex flex-wrap justify-between bg-violet  items-stretch w-full min-h-[30vh]">
      <div className="p-4 w-full lg:w-4/12 h-full">
        <div className="h-full">
          <TrendStats data={token} />
        </div>
      </div>
      <div className="p-4 w-full lg:w-4/12 flex flex-col ">
        <div className="flex-grow">
          <Trending data={token} />
        </div>
      </div>
      <div className="p-4 w-full lg:w-4/12 flex flex-col ">
        <div className="flex-grow">
          <Hot data={token} />
        </div>
      </div>
    </div>
  );
};

export default CBRCTrends;
