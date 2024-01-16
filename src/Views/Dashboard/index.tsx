"use client";
import React, { useState, useEffect, useCallback } from "react";
import { IInscription, ITransaction } from "@/types";
import { useRouter } from "next/navigation";
import CardContent from "@/components/elements/CustomCardSmall/CardContent";
import { shortenString } from "@/utils";
import { CircularProgress } from "@mui/material";
import { fetchInscriptions } from "@/apiHelper/fetchInscriptions";
import { useWalletAddress } from "bitcoin-wallet-adapter";
import Link from "next/link";
import InscriptionDisplay from "@/components/elements/InscriptionDisplay";
import copy from "copy-to-clipboard";
import { addNotification } from "@/stores/reducers/notificationReducer";
import { useDispatch } from "react-redux";
import { FetchCBRCBalance } from "@/apiHelper/getCBRCWalletBalance";
import CustomSearch from "@/components/elements/CustomSearch";
import { FaCopy, FaSearch } from "react-icons/fa";
import CustomPaginationComponent from "@/components/elements/CustomPagination";
import CustomTab from "@/components/elements/CustomTab";
import { fetchTxes } from "@/apiHelper/fetchTxes";
import MySales from "./MyActivity";

function AccountPage() {
  const [inscriptions, setInscriptions] = useState<IInscription[] | null>(null);
  const [sales, setSales] = useState<ITransaction[] | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [profile, setProfile] = useState<IInscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [cbrcs, setCbrcs] = useState<any>(null);
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [page_size, setPage_size] = useState(20);
  const [tab, setTab] = useState<"cbrc-20" | "all" | "activity">("cbrc-20");

  const walletDetails = useWalletAddress();
  const fetchWalletInscriptions = useCallback(async () => {
    if (tab !== "activity") {
      try {
        const params = {
          wallet: walletDetails?.ordinal_address,
          page_size: page_size,
          page,
          inscription_number: Number(search),
          sort: "inscription_number:-1",
          ...(tab === "cbrc-20" && { metaprotocol: "transfer" }),
        };

        const result = await fetchInscriptions(params);
        if (result && result.data) {
          // Do something with the fetched data
          setProfile(
            result.data.inscriptions.filter(
              (a) => a?.content_type && a?.content_type.includes("image")
            )[0]
          );
          if (tab === "cbrc-20")
            setInscriptions(
              result.data.inscriptions.filter(
                (a) =>
                  (a.cbrc_valid && a.tags?.includes("text")) ||
                  !a.tags?.includes("text")
              )
            );
          else setInscriptions(result.data.inscriptions);
          setTotal(result.data.pagination.total);
        }
        setLoading(false);
      } catch (e: any) {
        setLoading(false);
      }
    }
  }, [walletDetails, page, search, tab]);

  const fetchSales = useCallback(async () => {
    if (tab === "activity") {
      try {
        const params = {
          wallet: walletDetails?.ordinal_address,
          page_size: page_size,
          page,
          sort: "timestamp:-1",
        };

        const result = await fetchTxes(params);
        if (result && result.data) {
          setSales(result.data.txes);
          setTotal(result.data.pagination.total);
        }
        setLoading(false);
      } catch (e: any) {
        setLoading(false);
      }
    }
  }, [walletDetails, page, search, tab]);

  const fetchCbrcBrc20 = useCallback(async () => {
    try {
      if (!walletDetails?.ordinal_address) return;
      const params = {
        address: walletDetails.ordinal_address,
      };

      const result = await FetchCBRCBalance(params);
      if (result && result.data) {
        setCbrcs(result.data);
      }
    } catch (e: any) {}
  }, [walletDetails]);

  useEffect(() => {
    if (walletDetails?.connected && walletDetails.ordinal_address) {
      if (tab === "activity") fetchSales();
      else fetchWalletInscriptions();
    }
  }, [walletDetails, tab, page]);

  useEffect(() => {
    if (walletDetails?.connected && walletDetails.ordinal_address) {
      fetchCbrcBrc20();
    }
  }, [walletDetails]);

  useEffect(() => {
    if (!walletDetails?.connected && !loading) {
      return router.push("/");
    }
  }, [walletDetails, loading]);

  const dispatch = useDispatch();

  const handleSearchChange = (value: string) => {
    setSearch(value);
  };

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setPage(value);
  };

  return (
    <div className="pt-16 text-white">
      <div className="profile w-full flex flex-wrap items-start border-2 rounded-xl p-6 py-16 border-accent">
        <div className="w-[200px] relative">
          {inscriptions?.length && profile?.inscription_id ? (
            <CardContent
              inscriptionId={profile?.inscription_id}
              content_type={profile?.content_type}
              inscription={profile}
            />
          ) : (
            <CardContent
              inscriptionId="9d0ad29ef2923df9d598a1a890ead36ebbe44f1f1d77d93efa21325806311f28i0"
              content_type="image/gif"
            />
          )}
        </div>
        {walletDetails && (
          <>
            {" "}
            <div className="pl-4">
              <div className="text-white text-sm hidden lg:block">
                <div
                  className="flex justify-start items-center bg-slate-700 tracking-widest px-4 py-2 rounded cursor-pointer mb-2"
                  onClick={() => {
                    copy(walletDetails?.ordinal_address + "");
                    dispatch(
                      addNotification({
                        id: new Date().valueOf(),
                        message: "Address Copied",
                        open: true,
                        severity: "success",
                      })
                    );
                  }}
                >
                  <span>{walletDetails?.ordinal_address}</span>
                  <FaCopy className="ml-2" />
                </div>
                {walletDetails &&
                  walletDetails.ordinal_address !==
                    walletDetails.cardinal_address && (
                    <div
                      className="flex justify-start items-center bg-slate-700 tracking-widest px-4 py-2 rounded cursor-pointer mb-2"
                      onClick={() => {
                        copy(walletDetails?.cardinal_address + "");
                        dispatch(
                          addNotification({
                            id: new Date().valueOf(),
                            message: "Address Copied",
                            open: true,
                            severity: "success",
                          })
                        );
                      }}
                    >
                      <span>{walletDetails?.cardinal_address}</span>
                      <FaCopy className="ml-2" />
                    </div>
                  )}
              </div>
              <div className="text-gray-400 text-xs lg:hidden w-full">
                <div
                  className="flex justify-start items-center bg-slate-700 tracking-widest px-4 py-2 rounded cursor-pointer mb-2"
                  onClick={() => {
                    copy(walletDetails?.ordinal_address + "");
                    dispatch(
                      addNotification({
                        id: new Date().valueOf(),
                        message: "Address Copied",
                        open: true,
                        severity: "success",
                      })
                    );
                  }}
                >
                  <span>
                    {shortenString(walletDetails?.ordinal_address || "")}
                  </span>
                  <FaCopy className="ml-2" />
                </div>
                {walletDetails &&
                  walletDetails.cardinal_address !==
                    walletDetails.ordinal_address && (
                    <div
                      className="flex justify-start items-center bg-slate-700 tracking-widest px-4 py-2 rounded cursor-pointer mb-2"
                      onClick={() => {
                        copy(walletDetails?.cardinal_address + "");
                        dispatch(
                          addNotification({
                            id: new Date().valueOf(),
                            message: "Address Copied",
                            open: true,
                            severity: "success",
                          })
                        );
                      }}
                    >
                      <span>
                        {shortenString(walletDetails?.cardinal_address || "")}
                      </span>
                      <FaCopy className="ml-2" />
                    </div>
                  )}
              </div>
            </div>
            <div className="py-4 md:py-0 flex-1 md:flex md:justify-center lg:justify-end">
              <Link href="/crafter">
                <p className="w-full md:w-auto px-4 py-1 bg-bitcoin text-yellow-900">
                  Create Transfer Inscription
                </p>
              </Link>
            </div>
          </>
        )}
      </div>
      <div className="pb-6 py-16 flex justify-center lg:justify-start ">
        <CustomTab
          tabsData={[
            { label: "CBRC-20", value: "cbrc-20" },
            // { label: "All", value: "all" },
            { label: "My Activity", value: "activity" },
          ]}
          currentTab={tab}
          onTabChange={(_, newTab) => setTab(newTab)}
        />
      </div>{" "}
      <div className="">
        {tab === "cbrc-20" && cbrcs && cbrcs.length ? (
          <div className="py-16">
            <h2 className="font-bold text-2xl pb-6">Balance</h2>
            <p className="text-sm py-2">Your Valid CBRC-20 Balance</p>
            <div className="flex justify-start items-center flex-wrap">
              {cbrcs.map((item: any) => (
                <div
                  key={item.tick}
                  className="w-full md:w-2/12 lg:w-3/12 2xl:w-2/12 p-2"
                >
                  <Link href={`/cbrc-20/${item.tick}`}>
                    <div className="rounded border border-accent w-full min-h-[200px] flex justify-between flex-col">
                      <p className="uppercase text-center text-sm text-gray-300 mb-2 bg-accent_dark font-bold tracking-widest w-full py-2">
                        {item.tick}
                      </p>
                      <div className="w-full flex-1 p-3 tracking-wider uppercase">
                        <div className="text-center text-sm text-white flex justify-between w-full py-2">
                          <span> Available:</span> <p>{item.amt}</p>
                        </div>
                        <div className="text-center text-sm text-white flex justify-between w-ful py-2l">
                          <span>Transferable: </span>
                          <span>{item.lock}</span>
                        </div>
                        <hr className="my-2 bg-white border-2 border-white" />
                        <div className="text-center text-sm text-white flex justify-between w-full py-2">
                          <span>Total:</span>{" "}
                          <span>{item.amt + item.lock}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <></>
        )}
      </div>
      <div className="SortSearchPages py-6 flex flex-wrap justify-between">
        {tab !== "activity" && (
          <div className="w-full lg:w-auto flex justify-start items-center flex-wrap">
            <div className="w-full center pb-4 lg:pb-0 md:pl-4 lg:w-auto">
              <CustomSearch
                placeholder="Inscription Number #"
                value={search}
                onChange={handleSearchChange}
                icon={FaSearch}
                end={true}
                onIconClick={() => fetchWalletInscriptions()}
              />
            </div>
          </div>
        )}
        {total / page_size > 1 && (
          <div className="w-full lg:w-auto center">
            <CustomPaginationComponent
              count={Math.ceil(total / page_size)}
              onChange={handlePageChange}
              page={page}
            />
          </div>
        )}
      </div>
      {tab === "activity" ? (
        <MySales address={walletDetails?.ordinal_address || ""} />
      ) : (
        <div className="py-6">
          {inscriptions?.length ? (
            <InscriptionDisplay
              data={inscriptions}
              loading={loading}
              pageSize={page_size}
              refreshData={fetchWalletInscriptions}
              availableCbrcsBalance={cbrcs}
            />
          ) : (
            <>
              {loading ? (
                <>
                  {walletDetails ? (
                    <div className="text-white center py-16">
                      <CircularProgress size={20} color="inherit" />
                    </div>
                  ) : (
                    <div className="text-white center py-16">
                      Wallet not connected
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-16">
                  {tab === "cbrc-20" ? (
                    <>
                      {page > 1 ? (
                        <div className="text-xs ">
                          <p className="pb-2">
                            No valid transferable inscription Found in this page
                          </p>
                        </div>
                      ) : (
                        <div className="text-xs ">
                          <p className="pb-2">
                            If Your Transferable Balance is 0 -{">"} Inscribe a
                            Transfer Inscription{" "}
                          </p>
                          <p>
                            If Your Transferable Balance is greater than 0 and
                            Inscription is not present, Please wait, your
                            Inscription will appear.
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    "No Inscriptions Found"
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default AccountPage;
