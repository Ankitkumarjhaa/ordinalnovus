"use client";
import CustomPaginationComponent from "@/components/elements/CustomPagination";
import CustomSelector from "@/components/elements/CustomSelector";
import { addNotification } from "@/stores/reducers/notificationReducer";
import { ICollection } from "@/types";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import CollectionItemCard from "./CollectionItemCard";
import SkeletonCollectionItemCard from "./SkeletonCollectionItemCard";
import { fetchCollections } from "@/apiHelper/fetchCollection";
import mixpanel from "mixpanel-browser";

const options = [
  { value: "updated_at:1", label: "Default" },
  { value: "name:1", label: "Name" },
];

function CollectionsPage() {
  const dispatch = useDispatch();
  const [page, setPage] = useState<number>(1);
  const [data, setData] = useState<ICollection[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(20);
  const [sort, setSort] = useState<string>("updated_at:1");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const result = await fetchCollections({
        page,
        pageSize,
        sort,
        live: true,
      });

      // Mixpanel Tracking
      mixpanel.track("Collection Fetch Data", {
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
        setData(result.data.collections);
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
    <section>
      <p className="text-center ">Contact us to verify your collection data</p>
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
        {loading ? (
          Array.from(Array(pageSize)).map((_, i) => (
            <SkeletonCollectionItemCard key={i} />
          ))
        ) : data.length > 0 ? (
          data.map((item) => <CollectionItemCard key={item._id} item={item} />)
        ) : (
          <div className="center w-full">
            <p className="text-lg">No Item Found</p>
          </div>
        )}
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

export default CollectionsPage;
