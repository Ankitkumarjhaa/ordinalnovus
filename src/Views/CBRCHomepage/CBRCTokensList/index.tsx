"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { CircularProgress } from "@mui/material";
import CustomSearch from "@/components/elements/CustomSearch";
import { FaSearch } from "react-icons/fa";
import CustomPaginationComponent from "@/components/elements/CustomPagination";
import { ICbrcToken } from "@/types/CBRC";
import { FetchCBRC } from "@/apiHelper/getCBRC";
import TokenList from "./TokenList";

function CBRCTokensList({ defaultData }: { defaultData: ICbrcToken[] }) {
  const dispatch = useDispatch();
  const [page, setPage] = useState<number>(1);
  const [data, setData] = useState<ICbrcToken[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(20);
  const [sort, setSort] = useState<string>("on_volume:-1");
  const [loading, setLoading] = useState<boolean>(true);
  const [tick, setTick] = useState("");

  const fetchData = useCallback(async () => {
    {
      setLoading(true);
      setData([]);
      const result = await FetchCBRC({
        page,
        page_size: pageSize,
        sort,
        allowed: true,
        ...(tick && { search: tick }),
      });
      if (result && result.data) {
        setData(result.data.tokens);
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

  const renderPagination = () =>
    data?.length > 0 && (
      <div className="w-full lg:w-auto center">
        <CustomPaginationComponent
          count={Math.ceil(totalCount / pageSize)}
          onChange={handlePageChange}
          page={page}
        />
      </div>
    );

  return (
    <div>
      <div className="SortSearchPages py-6 flex flex-wrap justify-between">
        <div className="w-full lg:w-auto flex justify-start items-center flex-wrap">
          <div className="w-full center pb-4 lg:pb-0 lg:w-auto">
            <CustomSearch
              placeholder="Ticker"
              value={tick}
              onChange={handleSearchChange}
              icon={FaSearch}
              end={true}
              onIconClick={fetchData}
            />
          </div>
          {/* <div className="w-full md:w-auto p-2 px-6">
            <div className="capitalize pb-1 text-xs flex items-center justify-evenly">
              <p> Buy Items with checkmark </p>
              <FaCheckCircle className="text-green-400 mx-2" />
            </div>
          </div> */}
        </div>
        {renderPagination()}
      </div>
      {!data || !defaultData ? (
        <>
          {loading ? (
            <div className="text-white center py-16">
              <CircularProgress size={20} color="inherit" />
            </div>
          ) : (
            <p className="min-h-[20vh] center"> No CBRC Token Found</p>
          )}
        </>
      ) : (
        <TokenList tokens={data || defaultData} loading={loading} />
      )}
      <div className="flex justify-end w-full pt-6">{renderPagination()}</div>
    </div>
  );
}

export default CBRCTokensList;
