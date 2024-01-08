"use client";
import React, { useState } from "react";
import CBRCTokensList from "./CBRCTokensList";
import { IToken } from "@/types/CBRC";
import CustomTab from "@/components/elements/CustomTab";
import CBRCSales from "./CBRCSales";
import CBRCLatestListings from "./CBRCListings";
import CbrcHero from "./CBRCHero";
import CBRCStats from "./CBRCStats";
import { IStats } from "@/types";
import CBRCTrends from "./CBRCTrends";
function CBRCHomepage({ tokens, stats }: { tokens: IToken[]; stats: IStats }) {
  const [tab, setTab] = useState("tokens");

  console.log(stats, "stats");

  return (
    <div>
      <CBRCStats stats={stats} />
      {/* <CbrcHero /> */}
      <CBRCTrends token={stats} />
      <div className="pb-6 py-16 flex justify-center lg:justify-start ">
        <CustomTab
          tabsData={[
            { label: "Tokens", value: "tokens" },
            { label: "Listings", value: "listings" },
            { label: "Sales", value: "sales" },
          ]}
          currentTab={tab}
          onTabChange={(_, newTab) => setTab(newTab)}
        />
      </div>{" "}
      {tab === "tokens" && <CBRCTokensList defaultData={tokens} />}
      {tab === "sales" && <CBRCSales />}
      {tab === "listings" && <CBRCLatestListings />}
    </div>
  );
}

export default CBRCHomepage;
