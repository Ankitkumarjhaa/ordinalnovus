"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { IInscription } from "@/types";
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
import { FaSearch } from "react-icons/fa";
import CustomPaginationComponent from "@/components/elements/CustomPagination";
import CustomTab from "@/components/elements/CustomTab";

function AccountPage() {
  const [inscriptions, setInscriptions] = useState<IInscription[] | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [profile, setProfile] = useState<IInscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [cbrcs, setCbrcs] = useState<any>(null);
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [page_size, setPage_size] = useState(10);
  const [tab, setTab] = useState<"cbrc-20" | "inscriptions">("cbrc-20");

  const walletDetails = useWalletAddress();

  const fetchAllInscriptions = useCallback(async () => {
    if (tab === "inscriptions") {
      try {
        const params = {
          wallet: walletDetails?.ordinal_address,
          page_size: page_size,
          page,
          inscription_number: Number(search),
          sort: "inscription_number:-1",
        };

        const result = await fetchInscriptions(params);
        if (result && result.data) {
          // Do something with the fetched data
          setProfile(
            result.data.inscriptions.filter(
              (a) => a?.content_type && a?.content_type.includes("image")
            )[0]
          );
          setInscriptions(result.data.inscriptions);
          setTotal(result.data.pagination.total);
        }
        setLoading(false);
      } catch (e: any) {
        setLoading(false);
      }
    }
  }, [walletDetails, page, search, tab]);

  const fetchValidCbrcInscriptions = useCallback(async () => {
    if (tab === "cbrc-20") {
      try {
        const params = {
          wallet: walletDetails?.ordinal_address,
          page_size: page_size,
          page,
          inscription_number: Number(search),
          sort: "inscription_number:-1",
          metaprotocol: "transfer",
        };

        const result = await fetchInscriptions(params);
        if (result && result.data) {
          // Do something with the fetched data
          setProfile(
            result.data.inscriptions.filter(
              (a) => a?.content_type && a?.content_type.includes("image")
            )[0]
          );
          setInscriptions(result.data.inscriptions.filter((a) => a.cbrc_valid));
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
      let cbrc_bal: any[] = [];
      if (!walletDetails?.ordinal_address) return;
      const params = {
        address: walletDetails.ordinal_address,
      };

      const result = await FetchCBRCBalance(params);
      if (result && result.data) {
        cbrc_bal = [...result.data];
      }

      const result_2 = await FetchCBRCBalance(params);
      if (result_2 && result_2.data) {
        cbrc_bal = [...cbrc_bal, ...result_2.data];
      }
    } catch (e: any) {}
  }, [walletDetails]);

  useEffect(() => {
    if (
      walletDetails?.connected &&
      walletDetails.ordinal_address &&
      tab === "inscriptions"
    ) {
      fetchAllInscriptions();
    }
  }, [walletDetails, page, tab]);

  useEffect(() => {
    if (
      walletDetails?.connected &&
      walletDetails.ordinal_address &&
      tab === "cbrc-20"
    ) {
      fetchCbrcBrc20();
      fetchValidCbrcInscriptions();
    }
  }, [walletDetails, page, tab]);

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

  const handleTabChange = (
    event: any,
    newValue: "cbrc-20" | "inscriptions"
  ) => {
    setTab(newValue);
  };

  return (
    <div className="pt-16 text-white">
      <div className="profile w-full flex flex-wrap items-start border-b-2 py-6 border-accent">
        <div className="w-[100px]">
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
        <div className="pl-4">
          <div className="text-white text-sm hidden lg:block">
            <p
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
              className="bg-secondary border-accent border rounded my-2 py-1 px-2 text-xs cursor-pointer hover:text-yellow-900 hover:bg-bitcoin"
            >
              {walletDetails?.ordinal_address}
            </p>
            <p
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
              className="bg-secondary border-accent border rounded my-2 py-1 px-2 text-xs cursor-pointer hover:text-yellow-900 hover:bg-bitcoin"
            >
              {" "}
              {walletDetails?.cardinal_address}
            </p>
          </div>
          <div className="text-gray-400 text-xs lg:hidden">
            <p
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
              className="bg-secondary border-accent border rounded my-2 py-1 px-2 text-xs cursor-pointer hover:text-yellow-900 hover:bg-bitcoin"
            >
              {shortenString(walletDetails?.ordinal_address || "")}
            </p>
            <p
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
              className="bg-secondary border-accent border rounded my-2 py-1 px-2 text-xs cursor-pointer hover:text-yellow-900 hover:bg-bitcoin"
            >
              {shortenString(walletDetails?.ordinal_address || "")}
            </p>
          </div>
        </div>
        <div className="flex-1 flex justify-center lg:justify-end">
          <Link href="https://www.cybord.org/thecraft.html" target="_blank">
            <p className="px-4 py-1 bg-bitcoin text-yellow-900">
              Create Transfer Inscription
            </p>
          </Link>
        </div>
      </div>
      {/* <div className="py-16">
        <CustomTab
          tabsData={[
            { label: "CBRC-20", value: "cbrc-20" },
            { label: "All Inscriptions", value: "inscriptions" },
          ]}
          currentTab={tab}
          onTabChange={() => setTab(tab)}
        />
      </div> */}
      <div className="">
        {cbrcs && cbrcs.length ? (
          <div className="py-16">
            <h2 className="font-bold text-2xl pb-6">Balance</h2>
            <p className="text-sm py-2">Your Valid CBRC-20 Balance</p>
            <div className="flex justify-start items-center flex-wrap">
              {cbrcs.map((item: any) => (
                <div
                  key={item.tick}
                  className="w-full md:w-2/12 lg:w-3/12 2xl:w-2/12 p-2"
                >
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
                        <span>Total:</span> <span>{item.amt + item.lock}</span>
                      </div>
                      {/* {item.lock === 0 ? (
                          <div className=" bg-accent hover:bg-accent_dark text-center text-xs text-white flex justify-between w-full p-2">
                            Create Transfer Inscription
                          </div>
                        ) : (
                          <></>
                        )} */}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <></>
        )}
      </div>
      <div className="SortSearchPages py-6 flex flex-wrap justify-between">
        <div className="w-full lg:w-auto flex justify-start items-center flex-wrap">
          <div className="w-full center pb-4 lg:pb-0 md:pl-4 lg:w-auto">
            <CustomSearch
              placeholder="Inscription Number #"
              value={search}
              onChange={handleSearchChange}
              icon={FaSearch}
              end={true}
              onIconClick={() =>
                tab === "cbrc-20"
                  ? fetchValidCbrcInscriptions()
                  : fetchAllInscriptions()
              }
            />
          </div>
        </div>
        {inscriptions && inscriptions?.length > 0 && (
          <div className="w-full lg:w-auto center">
            <CustomPaginationComponent
              count={Math.ceil(total / page_size)}
              onChange={handlePageChange}
              page={page}
            />
          </div>
        )}
      </div>
      <div className="py-6">
        {inscriptions?.length ? (
          <InscriptionDisplay
            data={inscriptions}
            loading={loading}
            pageSize={10}
          />
        ) : (
          <>
            {loading ? (
              <div className="flex items-center justify-center h-screen">
                <CircularProgress size={60} />
              </div>
            ) : (
              <div className="text-center py-16">
                {tab === "cbrc-20" ? (
                  <div className="text-xs ">
                    <p className="pb-2">
                      If Your Transferable Balance is 0 -{">"} Inscribe a
                      Transfer Inscription{" "}
                    </p>
                    <p>
                      If Your Transferable Balance is greater than 0 and
                      Inscription is not present, Please wait, your Inscription
                      will appear.
                    </p>
                  </div>
                ) : (
                  "No Inscriptions Found"
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default AccountPage;
