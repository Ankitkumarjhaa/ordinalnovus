"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { IInscription } from "@/types";
import CbrcListings from "../../CbrcPage/CbrcDetailPage/CbrcListings";
import { CircularProgress } from "@mui/material";
import { fetchCBRCListings } from "@/apiHelper/fetchCBRCListings";
import CustomSelector from "@/components/elements/CustomSelector";
import CustomSearch from "@/components/elements/CustomSearch";
import { FaCheckCircle, FaSearch } from "react-icons/fa";
import CustomPaginationComponent from "@/components/elements/CustomPagination";

const options = [
  { value: "listed_at:-1", label: "Latest Listings" },
  { value: "listed_price:1", label: "Low Price" },
  { value: "inscription_number:1", label: "Low Number" },
];

function CBRCListings() {
  const dispatch = useDispatch();
  const [page, setPage] = useState<number>(1);
  const [data, setData] = useState<IInscription[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [sort, setSort] = useState<string>("listed_at:-1");
  const [loading, setLoading] = useState<boolean>(true);
  const [tick, setTick] = useState("");

  const fetchData = useCallback(async () => {
    {
      setLoading(true);
      setData([]);
      const result = await fetchCBRCListings({
        page,
        page_size: pageSize,
        sort,
        ...(tick && { tick }),
      });
      if (result && result.data) {
        setData(result.data.inscriptions);
        setTotalCount(result.data.pagination.total);
        setLoading(false);
      }
    }
  }, [sort, page, pageSize, tick]);

  useEffect(() => {
    fetchData();
  }, [sort, page, dispatch, pageSize]);

  const handleSearchChange = (value: string) => {
    setTick(value);
  };
  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setPage(value);
  };

  return (
    <div>
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
          <div className="w-full center pb-4 lg:pb-0 md:pl-4 lg:w-auto">
            <CustomSearch
              placeholder="Ticker"
              value={tick}
              onChange={handleSearchChange}
              icon={FaSearch}
              end={true}
              onIconClick={fetchData}
            />
          </div>
          <div className="w-full md:w-auto p-2 px-6">
            <p className="capitalize pb-1">Buy Items with two checks</p>
            <div className="flex items-center justify-between">
              <div className="text-xs text-center flex flex-col justify-center items-center">
                <p>Taproot Asset</p>
                <FaCheckCircle className="text-green-400 mx-2" />
              </div>
              <div className="ml-3 text-xs text-center  flex flex-col justify-center items-center">
                <p>Validity Check</p>
                <FaCheckCircle className="text-green-400 mx-2" />
              </div>
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
    </div>
  );
}

export default CBRCListings;
