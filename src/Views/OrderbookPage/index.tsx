"use client";
import CustomPaginationComponent from "@/components/elements/CustomPagination";
import CustomSelector from "@/components/elements/CustomSelector";
import { addNotification } from "@/stores/reducers/notificationReducer";
import { IInscription } from "@/types";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import mixpanel from "mixpanel-browser";
import { fetchInscriptions } from "@/apiHelper/fetchInscriptions";
import InscriptionDisplay from "@/components/elements/InscriptionDisplay";

const options = [
  { value: "updated_at:-1", label: "Default" },
  { value: "listed_price:1", label: "Price Low" },
  { value: "listed_price:-1", label: "Price High" },
  { value: "inscription_number:1", label: "Inscription Number Low" },
  { value: "inscription_number:-1", label: "Inscription Number High" },
];

function OrderbookPage() {
  const dispatch = useDispatch();
  const [page, setPage] = useState<number>(1);
  const [data, setData] = useState<IInscription[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(20);
  const [sort, setSort] = useState<string>("updated_at:-1");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const result = await fetchInscriptions({
        page,
        page_size: pageSize,
        sort,
        listed: true,
      });


      // Mixpanel Tracking
      mixpanel.track("Orderbook Fetch Data", {
        page_number: page,
        page_size: pageSize,
        sort: sort,
        // Additional properties if needed
      });

      if (result && result.error) {
        dispatch(
          addNotification({
            id: new Date().valueOf(),
            severity: "error",
            message: result.error,
            open: true,
          })
        );
      } else if (result && result.data) {
        setData(result.data.inscriptions);
        setTotalCount(result.data.pagination.total);
        setLoading(false);
      }
    };

    fetchData();
  }, [sort, page, dispatch, pageSize]);

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setPage(value);
  };

  return (
    <section className="min-h-[40vh]">
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
        </div>
        {data.length > 0 && (
          <div className="w-full lg:w-auto center">
            <CustomPaginationComponent
              count={Math.ceil(totalCount / pageSize)}
              onChange={handlePageChange}
              page={page}
            />
          </div>
        )}
      </div>
      <div className="flex items-center flex-wrap">
        <InscriptionDisplay data={data} loading={loading} pageSize={pageSize} />
      </div>
      <div className="SortSearchPages py-6 flex justify-end">
        {data.length > 0 && (
          <div className="">
            <CustomPaginationComponent
              count={Math.ceil(totalCount / pageSize)}
              onChange={handlePageChange}
              page={page}
            />
          </div>
        )}
      </div>
    </section>
  );
}

export default OrderbookPage;
