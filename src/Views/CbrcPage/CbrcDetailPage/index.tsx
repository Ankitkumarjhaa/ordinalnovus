"use client";
import { Icbrc } from "@/types/CBRC";
import React, { useEffect, useState } from "react";
import Hero from "./CbrcHero";
import { fetchInscriptions } from "@/apiHelper/fetchInscriptions";
import { useDispatch } from "react-redux";
import { IInscription } from "@/types";
import mixpanel from "mixpanel-browser";
import { addNotification } from "@/stores/reducers/notificationReducer";
import CbrcListings from "./CbrcListings";

type CbrcDetailPageProps = {
  cbrc: Icbrc;
};

function CbrcDetailPage({ cbrc }: CbrcDetailPageProps) {
  const dispatch = useDispatch();
  const [page, setPage] = useState<number>(1);
  const [data, setData] = useState<IInscription[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(100);
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
      if (result && result.data) {
        setData(result.data.inscriptions);
        setTotalCount(result.data.pagination.total);
        setLoading(false);
      }
    };

    fetchData();
  }, [sort, page, dispatch, pageSize]);

  return (
    <div>
      <Hero data={cbrc} listings={data} />
      {data && data?.length ? (
        <CbrcListings data={cbrc} listings={data} />
      ) : (
        <p className="min-h-[20vh] center"> No Listings Found</p>
      )}
    </div>
  );
}

export default CbrcDetailPage;
