"use client";
import { ICbrcToken } from "@/types/CBRC";
import React, { useState } from "react";
import Hero from "./CbrcHero";
import CustomTab from "@/components/elements/CustomTab";
import CBRCListingsData from "./CBRCListingsData";
import CBRCSales from "./CBRCSales";

type CbrcDetailPageProps = {
  cbrc: ICbrcToken;
};

function CbrcDetailPage({ cbrc }: CbrcDetailPageProps) {
  const [tab, setTab] = useState("listings");

  return (
    <div className="w-full">
      <Hero data={cbrc} />
      <div className="pb-6 py-16 flex justify-center lg:justify-start ">
        <CustomTab
          tabsData={[
            { label: "Listings", value: "listings" },
            { label: "Sales", value: "sales" },
          ]}
          currentTab={tab}
          onTabChange={(_, newTab) => setTab(newTab)}
        />
      </div>{" "}
      {tab === "listings" ? (
        <CBRCListingsData cbrc={cbrc} />
      ) : (
        <CBRCSales tick={cbrc.tick.trim().toLowerCase()} />
      )}
    </div>
  );
}

export default CbrcDetailPage;
