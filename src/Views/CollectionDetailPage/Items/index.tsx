"use client";
import { fetchInscriptions } from "@/apiHelper/fetchInscriptions";
import CustomPaginationComponent from "@/components/elements/CustomPagination";
import CustomSearch from "@/components/elements/CustomSearch";
import CustomSelector from "@/components/elements/CustomSelector";
import { addNotification } from "@/stores/reducers/notificationReducer";
import { ICollection, IInscription } from "@/types";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import CollectionItemCard from "./CollectionItemCard";
import SkeletonCollectionItemCard from "./SkeletonCollectionItemCard";

type ItemProps = {
  total: number;
  collection: ICollection;
};

const options = [
  { value: "listed_price:-1", label: "Default" },
  { value: "collection_item_number:1", label: "Item Name" },
  { value: "inscription_number:1", label: "Number" },
];

function Items({ collection }: ItemProps) {
  const dispatch = useDispatch();
  const [page, setPage] = useState<number>(1);
  const [data, setData] = useState<IInscription[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(40);
  const [sort, setSort] = useState<string>("listed_price:-1");
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const fetchData = async () => {
    setLoading(true);
    const result = await fetchInscriptions({
      slug: collection.slug,
      collection_id: collection._id,
      sort,
      search,
      page_size: pageSize,
      page,
      collection_item_number: search,
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
    } else if (result) {
      setData(result.data.inscriptions);
      setTotalCount(result.data.pagination.total);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [collection._id, sort, search, page, dispatch, pageSize]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (value.length > 0) setPage(1);
  };

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setPage(value);
  };

  return (
    <section>
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
              placeholder="Search by item number..."
              value={search}
              onChange={handleSearchChange}
            />
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
      <div className="flex items-center flex-wrap">
        {loading ? (
          Array.from(Array(pageSize)).map((_, i) => (
            <SkeletonCollectionItemCard key={i} />
          ))
        ) : data?.length > 0 ? (
          data?.map((item) => (
            <CollectionItemCard
              key={item.inscription_id}
              collection={collection}
              item={item}
            />
          ))
        ) : (
          <div className="center w-full">
            <p className="text-lg">No Item Found</p>
          </div>
        )}
      </div>
      <div className="SortSearchPages py-6 flex justify-end">
        {data?.length > 0 && (
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

export default Items;
