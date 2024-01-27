"use client";
import { ICbrcToken, Icbrc } from "@/types/CBRC";
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { IInscription } from "@/types";
import CbrcListings from "./CbrcListings";
import { fetchCBRCListings } from "@/apiHelper/fetchCBRCListings";
import { CircularProgress } from "@mui/material";
import CustomPaginationComponent from "@/components/elements/CustomPagination";
import { FaCheckCircle } from "react-icons/fa";
import CustomSelector from "@/components/elements/CustomSelector";

const options = [
  { value: "listed_at:-1", label: "Latest Listings" },
  { value: "listed_price_per_token:1", label: "Low Price (Token)" },
  { value: "listed_price:1", label: "Low Price (Total)" },
];

function CBRCLatestListings() {
  const dispatch = useDispatch();
  const [page, setPage] = useState<number>(1);
  const [data, setData] = useState<IInscription[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [sort, setSort] = useState<string>("listed_at:-1");
  const [loading, setLoading] = useState<boolean>(true);

  const fetchData = useCallback(async () => {
    {
      setLoading(true);
      setData([]);
      const result = await fetchCBRCListings({
        page,
        page_size: pageSize,
        sort,
      });
      if (result && result.data) {
        setData(result.data.inscriptions);
        setTotalCount(result.data.pagination.total);
        setLoading(false);
      }
    }
  }, [sort, page, pageSize]);

  useEffect(() => {
    fetchData(); // Fetch data on mount and when dependencies change

    // const interval = setInterval(() => {
    //   fetchData(); // Fetch data every 10 seconds
    // }, 120000);

    // return () => clearInterval(interval); // Clear interval on unmount
  }, [sort, page, dispatch, pageSize]);

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setPage(value);
  };

  return (
    <div className="w-full">
      <div className="SortSearchPages py-6 flex flex-wrap justify-between">
        <div className="w-full lg:w-auto flex justify-start items-center flex-wrap">
          <div className="w-full center pb-4 lg:pb-0 lg:w-auto">
            <CustomSelector
              label="Sort"
              value={sort}
              options={options}
              onChange={setSort}
            />
          </div>
          <div className="w-full lg:w-auto p-2 px-6">
            <div className="capitalize pb-1 text-xs flex items-center justify-center lg:justify-evenly w-full">
              <p> Buy Items with checkmark </p>
              <FaCheckCircle className="text-green-400 mx-2" />
            </div>
          </div>
        </div>
        {data?.length > 0 && (
          <div className="w-full lg:w-auto center">
            <CustomPaginationComponent
              count={Math.ceil(totalCount / pageSize)}
              onChange={handlePageChange}
              page={page}
            />
          </div>
        )}
      </div>
      {!data || !data?.length ? (
        <>
          {loading ? (
            <div className="text-white center py-16">
              <CircularProgress size={20} color="inherit" />
            </div>
          ) : (
            <p className="min-h-[20vh] center"> No CBRC Listings Found</p>
          )}
        </>
      ) : (
        <CbrcListings listings={data} loading={loading} />
      )}
      {data?.length > 0 && (
        <div className="w-full center lg:justify-end">
          <CustomPaginationComponent
            count={Math.ceil(totalCount / pageSize)}
            onChange={handlePageChange}
            page={page}
          />
        </div>
      )}
    </div>
  );
}

export default CBRCLatestListings;
