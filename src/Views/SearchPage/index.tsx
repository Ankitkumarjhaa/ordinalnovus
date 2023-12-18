"use client";
import { fetchInscriptions } from "@/apiHelper/fetchInscriptions";
import CustomPaginationComponent from "@/components/elements/CustomPagination";
import CustomSearch from "@/components/elements/CustomSearch";
import CustomSelector from "@/components/elements/CustomSelector";
import InscriptionDisplay from "@/components/elements/InscriptionDisplay";
import { addNotification } from "@/stores/reducers/notificationReducer";
import { IInscription } from "@/types";
import mixpanel from "mixpanel-browser";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { useDispatch } from "react-redux";

const options = [
  { value: "sha", label: "SHA" },
  { value: "content", label: "Content" },
  { value: "content-type", label: "Content Type" },
  { value: "rarity", label: "Rarity" },
  { value: "bitmap", label: "Bitmap" },
  { value: "domain", label: "Domain" },
  // { value: "txid", label: "Transaction" },
  { value: "address", label: "Address" },
];

function SearchPage() {
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const router = useRouter();

  const [type, setType] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [url, setUrl] = useState("");

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<IInscription[] | null>(null);

  useEffect(() => {
    setSearch(searchParams?.get("q") || "");
    setType(searchParams?.get("type") || "");
    setPage(parseInt(searchParams?.get("page") || "1"));
    fetchData();
  }, [searchParams]);

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams();
      if (name !== "type") params.set("type", type);
      if (name !== "q") params.set("q", search);
      params.set(name, value);
      return params.toString();
    },
    [type, search, page]
  );

  const updateURL = (newQueryString: string) => {
    setUrl(pathname + `?${newQueryString}`);
  };

  const handleTypeChange = (value: string) => {
    setType(value);
    updateURL(createQueryString("type", value));
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    updateURL(createQueryString("q", value));
  };

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setPage(value);
  };

  const fetchData = useCallback(async () => {
    const tempSearch = searchParams?.get("q") || "";
    const tempType = searchParams?.get("type") || "";
    if (page && tempSearch && tempType) {
      try {
        setLoading(true);

        const params: any = {
          sort: "inscription_number:1",
          page_size: pageSize,
          page: page,
          search: tempSearch,
          type: tempType,
        };

        const result = await fetchInscriptions(params);

        if (result && result.error) {
          // Track catch block error
          mixpanel.track("Error", {
            tag: `Fetch Data Exception`,
            message: result.error || "Search page fetch error",
            search_query: tempSearch,
            search_type: tempType,
            page_number: page,
            // Additional properties if needed
          });
          dispatch(
            addNotification({
              id: new Date().valueOf(),
              severity: "error",
              message: result.error,
              open: true,
            })
          );
        } else if (result) {
          mixpanel.track("Search Page Fetch Success", {
            search_query: tempSearch,
            search_type: tempType,
            page_number: page,
            total_results: result.data.pagination.total,
            // Additional properties if needed
          });
          setData(result.data.inscriptions);
          setTotalCount(result.data.pagination.total);
          setLoading(false);
        }
      } catch (err: any) {
        // Track catch block error
        mixpanel.track("Error", {
          tag: `search page fetch error catch`,
          message: err?.response?.data?.message || err?.message || err,
          search_query: tempSearch,
          search_type: tempType,
          page_number: page,
          // Additional properties if needed
        });
        dispatch(
          addNotification({
            id: new Date().valueOf(),
            severity: "error",
            message: err?.response?.data?.message || err?.message || err,
            open: true,
          })
        );
      }
    } else {
      setLoading(false);
    }
  }, [searchParams, page]);

  const updateUrl = () => {
    //@ts-ignore
    router.push(url);
  };

  useEffect(() => {
    fetchData();
  }, [page]);

  return (
    <div className="min-h-[40vh]">
      <div className="w-full lg:w-auto flex justify-start items-center flex-wrap">
        <div className="w-full center pb-4 lg:pb-0 lg:w-auto">
          <CustomSelector
            label="Type"
            value={type}
            options={options}
            onChange={handleTypeChange}
          />
        </div>
        <div className="w-full center pb-4 lg:pb-0 md:pl-4 flex-1">
          <CustomSearch
            placeholder={`
            ${
              type == "content-type"
                ? "Eg: image, png | gif, gltf, mp3 | mpeg"
                : type === "bitmap"
                ? "1000.bitmap"
                : type === "domain"
                ? "cryptic.sats"
                : type === "content"
                ? "Krishna"
                : type === "sha"
                ? "edec67607ddc47e354aaaf2cea230bd05edc45f46214bdff672c71f5f2bf4204"
                : type === "transaction"
                ? "31833061114c2ee53d63dba53ef0bc2af741c87463cf573a4e211196883a5f2d"
                : "Search..."
            }`}
            value={search}
            onChange={handleSearchChange}
            fullWidth={true}
            icon={FaSearch}
            end={true}
            onIconClick={updateUrl}
          />
        </div>
        <div className="flex-1 flex justify-end">
          <CustomPaginationComponent
            count={Math.ceil(totalCount / pageSize)}
            onChange={handlePageChange}
            page={page}
          />
        </div>
      </div>
      <InscriptionDisplay data={data} loading={loading} pageSize={pageSize} />
      {totalCount > 0 ? (
        <div className="flex-1 flex justify-end">
          <CustomPaginationComponent
            count={Math.ceil(totalCount / pageSize)}
            onChange={handlePageChange}
            page={page}
          />
        </div>
      ) : (
        <></>
      )}
    </div>
  );
}

export default SearchPage;
