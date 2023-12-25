"use client";
import React, { useState } from "react";
import CBRCTokensList from "./CBRCTokensList";
import { IToken } from "@/types/CBRC";
import CustomTab from "@/components/elements/CustomTab";
import CBRCSales from "./CBRCSales";
function CBRCHomepage({ tokens }: { tokens: IToken[] }) {
  const [tab, setTab] = useState("listings");

  return (
    <div>
      <div className="w-full my-2 text-xs py-2 uppercase font-bold text-white text-center">
        <p
          className={`text-gray-700 bg-gray-100  py-2 w-full border-accent border rounded tracking-widest font-bold`}
        >
          Data provided below might have inaccuracies.
        </p>
      </div>
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
        <CBRCTokensList defaultData={tokens} />
      ) : (
        <CBRCSales />
      )}
    </div>
  );
}

export default CBRCHomepage;
