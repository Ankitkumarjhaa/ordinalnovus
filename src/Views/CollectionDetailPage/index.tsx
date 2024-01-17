"use client";
import { ICollection } from "@/types";
import React, { useState } from "react";
import Hero from "./Hero";
import Items from "./Items";
import Holders from "./Holders";
import mixpanel from "mixpanel-browser";
import { useWalletAddress } from "bitcoin-wallet-adapter";
import Sales from "./Sales";
type CollectionDetailPageProps = {
  collections: ICollection[];
  inscriptionCount: number;
};
function CollectionDetailPage({
  collections,
  inscriptionCount,
}: CollectionDetailPageProps) {
  const walletDetails = useWalletAddress();
  const [tab, setTab] = useState("items");
  return (
    <div className="pt-16">
      <Hero data={collections[0]} />
      <div className="mb-2 mt-4 flex space-x-3 justify-center lg:justify-start">
        <button
          className={`${
            tab === "items"
              ? "bg-accent text-white"
              : "bg-gray-300 text-primary"
          } text-sm tracking-widest px-6 rounded-md  py-3`}
          onClick={() => setTab("items")}
        >
          Collection Items
        </button>
        {!collections[0].metaprotocol && (
          <button
            disabled={!collections[0].holders_count}
            className={`border-l border-black ${
              tab === "holders"
                ? "bg-accent text-white"
                : "bg-gray-300 text-primary"
            } text-sm tracking-widest px-4 py-2 ${
              !collections[0].holders_count && " cursor-not-allowed"
            }`}
            onClick={() => {
              setTab("holders");
              if (collections[0].holders_count)
                mixpanel.track("Holders Tab Selected", {
                  collection: collections[0].name,
                  holders_count: collections[0].holders_count,
                  wallet: walletDetails?.ordinal_address,
                  // Additional properties if needed
                });
            }}
          >
            Holders
          </button>
        )}
        <button
          className={`border-l border-black ${
            tab === "sales"
              ? "bg-accent text-white"
              : "bg-gray-300 bg-opacity-30 text-white"
          } text-sm tracking-widest px-8 py-3 rounded-md`}
          onClick={() => setTab("sales")}
        >
          Sales
        </button>
      </div>
      {tab === "items" ? (
        <Items collection={collections[0]} total={inscriptionCount} />
      ) : tab === "sales" ? (
        <Sales collection={collections[0]} />
      ) : (
        <Holders collection={collections[0]} />
      )}
    </div>
  );
}

export default CollectionDetailPage;
