"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ICollection } from "@/types/Ordinals";
import { fetchCollections } from "@/apiHelper/fetchCollection";
import SearchCard from "./SearchCard";
import CustomButton from "@/components/elements/CustomButton";
import debounce from "lodash.debounce";

function Search() {
  const [id, setId] = useState("");
  const [collections, setCollections] = useState<ICollection[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const router = useRouter();

  const handleIDChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setId(event.target.value);
  };

  const debouncedFetch = useRef(
    debounce((id) => fetchCollectionsBySearch(id), 500)
  ).current;

  const fetchCollectionsBySearch = async (id: string) => {
    if (id.trim() !== "") {
      setLoading(true);
      const result = await fetchCollections({ search: id });
      setLoading(false);
      if (error) {
        setError(error);
        return;
      }
      if (result && result.data) setCollections(result?.data.collections);
    }
  };

  useEffect(() => {
    debouncedFetch(id);
  }, [id]);

  const handleSearch = () => {
    setCollections(null); // clear collections state
    router.push(`/search/${id}`);
  };

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="flex relative items-center justify-center w-full md:max-w-md max-w-lg mx-auto pb-6  lg:pb-0">
      <div
        id="main-searchbar"
        className="relative w-full flex justify-between items-center border xl:border-2 border-accent rounded-md"
      >
        <input
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
          className="w-full px-4 py-2 bg-transparent text-white placeholder-brand_text_primary focus:outline-none focus:shadow-outline"
          type="text"
          placeholder="Enter ID / Sats / Number / Collection"
          value={id}
          onChange={handleIDChange}
        />
        <CustomButton
          text="Search"
          onClick={() => handleSearch()}
          hoverBgColor="hover:bg-accent_dark"
          hoverTextColor="text-white"
          bgColor="bg-accent"
          textColor="text-white"
          className="flex transition-all"
        />
      </div>
      {collections && id && (
        <div className="absolute top-[100%] bg-secondary w-full max-h-[50vh] overflow-y-scroll small-scrollbar">
          {collections.map((collection) => (
            <SearchCard
              collection={collection}
              setCollections={setCollections}
              key={collection.slug}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Search;
