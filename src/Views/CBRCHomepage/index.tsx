"use client";
import React, { useState } from "react";
import CBRCTokensList from "./CBRCTokensList";
import { ICbrcToken } from "@/types/CBRC";
import CustomTab from "@/components/elements/CustomTab";
import CBRCSales from "./CBRCSales";
import CBRCLatestListings from "./CBRCListings";
import CbrcHero from "./CBRCHero";
import CBRCStats from "./CBRCStats";
import { ICollection, IStats } from "@/types";
import CBRCTrends from "./CBRCTrends";
import Homepage from "../Homepage";
function CBRCHomepage({
  featured,
  tokens,
  stats,
}: {
  tokens: ICbrcToken[];
  stats: IStats;
  featured: ICollection[];
}) {
  const [tab, setTab] = useState("tokens");

  return (
    <div className="min-h-[70vh]">
      <CBRCStats stats={stats} />
      {/* <div className="pb-6 py-16 flex justify-center lg:justify-start">
        <CustomTab
          tabsData={[
            { label: "Cbrc", value: "cbrc" },
            { label: "Marketpace", value: "markeplace" },
          ]}
          currentTab={tab}
          onTabChange={(_, newTab) => setTab(newTab)}
        />
      </div>{" "}
      {tab === "cbrc" && <CBRCHomepage  />}
      {tab === "marketplace" && <Homepage />} */}
      <CbrcHero data={featured} />
  <div className="pt-6">
  <CBRCTrends token={stats} />
  </div>
      <div className="pb-6 py-16 flex justify-center lg:justify-start">
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
