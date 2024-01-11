"use client";
import React, { useState, useEffect, useRef } from "react";
import { ICollection } from "@/types";
import { fetchCollections } from "@/apiHelper/fetchCollection";
import SearchCard from "./SearchCard";
import debounce from "lodash.debounce";
import { determineTypesFromId } from "@/utils";
import { FaBtc, FaSearch } from "react-icons/fa";
import { SiHiveBlockchain } from "react-icons/si";
import {
  Bs123,
  BsFillCollectionFill,
  BsTextParagraph,
  BsBrowserChrome,
} from "react-icons/bs";
import { HiDocument } from "react-icons/hi";
import { RiCharacterRecognitionFill } from "react-icons/ri";
import Link from "next/link";
import mixpanel from "mixpanel-browser";
import { useWalletAddress } from "bitcoin-wallet-adapter";
import { FaFile } from "react-icons/fa";

function Search() {
  const walletDetails = useWalletAddress();
  const [id, setId] = useState("");
  const [collections, setCollections] = useState<ICollection[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [possibleTypes, setPossibleTypes] = useState<string[]>([]);

  const handleIDChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setId(event.target.value);
  };

  const debouncedFetch = useRef(
    debounce((id) => handleSearch(id), 1000)
  ).current;

  async function handleSearch(id: string) {
    try {
      setLoading(true);
      const possible = determineTypesFromId(id);
      if (id)
        mixpanel.track("Search Initiated", {
          query: id,
          possible_types: possible,
          wallet: walletDetails?.ordinal_address || "",
          timestamp: new Date().toISOString(),
        });
      setPossibleTypes(possible);
      if (possible.includes("collection") && id) {
        // console.log({ possible, id });
        await fetchCollectionsBySearch(id);
      }
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  const fetchCollectionsBySearch = async (id: string) => {
    if (id.trim()) {
      // console.log("fetching coll data: ", id);
      const result = await fetchCollections({ search: id, live: true });
      if (result?.data) {
        setCollections(result.data.collections);
        mixpanel.track("Search Results Returned", {
          query: id,
          wallet: walletDetails?.ordinal_address || "",
          result_count: result.data.collections.length,
          collections: result.data.collections.length > 0,
          timestamp: new Date().toISOString(),
        });
      } else {
        mixpanel.track("No Search Results", {
          query: id,
          wallet: walletDetails?.ordinal_address || "",
          timestamp: new Date().toISOString(),
        });
      }
    }
  };

  useEffect(() => {
    debouncedFetch(id);
  }, [id]);

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  const determineUrl = (item: string, id: string) => {
    switch (true) {
      case item.includes("CBRC-20"):
        return `/cbrc-20/${id}`;
      case item.includes("sat name"):
        return `/sat/${id}`;
      case item.includes("inscription number"):
      case item.includes("inscription id"):
      case item.includes("sat"):
        return `/inscription/${id}`;
      case item.includes("token"):
      case item.includes("bitmap"):
      case item.includes("domain"):
      case item.includes("content"):
      case item.includes("address"):
      case item.includes("sha"):
      case item.includes("txid"):
      case item.includes("content-type"):
        return `/search?q=${id}&type=${item}`;
      default:
        return "/search";
    }
  };

  const renderItem = (item: string, idx: number) => {
    const url = determineUrl(item, id);

    const renderIcon = (item: any) => {
      // Icon rendering logic
      const icons = {
        sat: <FaBtc className="mr-2" />,
        number: <Bs123 className="mr-2" />,
        "inscription id": <HiDocument className="mr-2" />,
        collection: <BsFillCollectionFill className="mr-2" />,
        content: <BsTextParagraph className="mr-2" />,
        "sat name": <RiCharacterRecognitionFill className="mr-2" />,
        domain: <BsBrowserChrome className="mr-2" />,
        bitmap: <SiHiveBlockchain className="mr-2" />,
        "content-type": <FaFile className="mr-2" />,
      };
      return Object.keys(icons).find((key) => item.includes(key))
        ? //@ts-ignore
          icons[item]
        : null;
    };

    return (
      //@ts-ignore
      <Link className="search" tabIndex={idx} key={item} shallow href={url}>
        <div className="cursor-pointer">
          <div className="bg-primary text-xs items-center flex justify-start font-bold p-2 capitalize text-white">
            {renderIcon(item)}
            {item?.includes(" ") ? item?.split("_")[0] : item}
          </div>
          {collections && item.includes("collection") && id ? (
            <div className="w-full max-h-[50vh] overflow-y-scroll no-scrollbar">
              {collections.length ? (
                collections.map((collection) => (
                  <SearchCard
                    collection={collection}
                    setCollections={setCollections}
                    setId={setId}
                    key={collection.slug}
                  />
                ))
              ) : (
                <p className="p-2 hover:bg-gray-800 text-gray-200 ">
                  Not Found
                </p>
              )}
            </div>
          ) : (
            <p className="p-2 hover:bg-gray-800 text-gray-200 ">{id}</p>
          )}
        </div>
      </Link>
    );
  };

  return (
    <div
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setId("");
        }
      }}
      className="flex relative items-center justify-center w-full md:max-w-md max-w-lg 2xl:max-w-3xl mx-auto pb-6 lg:pb-0"
    >
      <div
        id="main-searchbar"
        className="relative w-full flex justify-between items-center border xl:border-2 border-accent rounded-md"
      >
        <input
          className="w-full px-2 py-2 bg-transparent text-white placeholder-brand_text_primary focus:outline-none focus:shadow-outline"
          type="text"
          placeholder="Enter ID / Sats / Number / Collection / bitmap / domain"
          value={id}
          onChange={handleIDChange}
        />
        <div className="text-bitcoin px-2">
          <FaSearch />
        </div>
      </div>
      {id && possibleTypes.length > 0 && (
        <div className="absolute top-[100%] bg-secondary w-full max-h-[50vh] overflow-y-auto overflow-x-hidden small-scrollbar p-1">
          {possibleTypes.map(renderItem)}
        </div>
      )}
    </div>
  );
}

export default Search;
