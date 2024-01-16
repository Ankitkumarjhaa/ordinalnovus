"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { CircularProgress } from "@mui/material";
import CustomPaginationComponent from "@/components/elements/CustomPagination";
import { fetchOrders } from "@/apiHelper/fetchOrders";
import { useWalletAddress } from "bitcoin-wallet-adapter";
import { IInscribeOrder } from "@/types";
import OrderList from "./OrderList";

function ShowOrders() {
  const dispatch = useDispatch();
  const [page, setPage] = useState<number>(1);
  const [data, setData] = useState<IInscribeOrder[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(20);
  const [sort, setSort] = useState<string>("createdAt:-1");
  const [loading, setLoading] = useState<boolean>(true);
  const [tick, setTick] = useState("");

  const walletDetails = useWalletAddress();

  const fetchData = useCallback(async () => {
    {
      setLoading(true);
      setData([]);
      const result = await fetchOrders({
        page,
        page_size: pageSize,
        sort,
        wallet: walletDetails?.ordinal_address,
      });

      if (result && result.data) {
        setData(result.data.orders);
        setTotalCount(result.data.pagination.total);
        setLoading(false);
      }
    }
  }, [sort, page, pageSize, tick, walletDetails]);

  useEffect(() => {
    fetchData();
  }, [sort, page, dispatch, pageSize, walletDetails]);

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
    <div className="w-full overflow-x-auto">
      <div className="SortSearchPages py-6 flex flex-wrap justify-between">
        <div className="w-full lg:w-auto flex justify-start items-center flex-wrap">
          {/* <div className="w-full center pb-4 lg:pb-0 lg:w-auto">
            <CustomSearch
              placeholder="Ticker"
              value={tick}
              onChange={handleSearchChange}
              icon={FaSearch}
              end={true}
              onIconClick={fetchData}
            />
          </div> */}
          {/* <div className="w-full md:w-auto p-2 px-6">
            <div className="capitalize pb-1 text-xs flex items-center justify-evenly">
              <p> Buy Items with checkmark </p>
              <FaCheckCircle className="text-green-400 mx-2" />
            </div>
          </div> */}
        </div>
        {data?.length > 0 && Math.ceil(totalCount / pageSize) > 1 && (
          <div className="w-full lg:w-auto center">
            <CustomPaginationComponent
              count={Math.ceil(totalCount / pageSize)}
              onChange={handlePageChange}
              page={page}
            />
          </div>
        )}
      </div>
      {!data ? (
        <>
          {loading ? (
            <div className="text-white center py-16">
              <CircularProgress size={20} color="inherit" />
            </div>
          ) : (
            <p className="min-h-[20vh] center"> No Orders Found</p>
          )}
        </>
      ) : (
        <OrderList orders={data} loading={loading} />
      )}
    </div>
  );
}

export default ShowOrders;
