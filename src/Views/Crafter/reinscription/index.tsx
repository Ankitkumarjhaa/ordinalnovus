import { fetchInscriptions } from "@/apiHelper/fetchInscriptions";
import CustomButton from "@/components/elements/CustomButton";
import CardContent from "@/components/elements/CustomCardSmall/CardContent";
import CustomPaginationComponent from "@/components/elements/CustomPagination";
import { IInscription } from "@/types";
import { shortenString } from "@/utils";
import { CircularProgress, Modal } from "@mui/material";
import { useWalletAddress } from "bitcoin-wallet-adapter";
import { useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";

function Reinscription({
  inscription,
  setInscription,
  inscriptionId,
  setInscriptionId,
  locked,
}: {
  inscription: IInscription | null;
  setInscription: any;
  inscriptionId: string;
  setInscriptionId: any;
  locked: boolean;
}) {
  const params = useSearchParams();
  const [inscriptions, setInscriptions] = useState<IInscription[] | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState(1);
  const [page_size, setPage_size] = useState(20);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const walletDetails = useWalletAddress();
  const fetchWalletInscriptions = useCallback(async () => {
    try {
      const queryParams: any = {
        wallet: walletDetails?.ordinal_address,
        page_size: page_size,
        page,
        inscription_number: Number(search),
        sort: "inscription_number:-1",
      };

      console.log({ queryParams });

      if (params && params?.get("inscription")) {
        setInscriptionId(params?.get("inscription"));
        queryParams.inscription_id = params.get("inscription");
      }

      setLoading(true);
      const result = await fetchInscriptions(queryParams);
      if (result && result.data) {
        setInscriptions(result.data.inscriptions);
        setTotal(result.data.pagination.total);
        if (
          params &&
          params?.get("inscription") &&
          result.data.inscriptions &&
          result.data.inscriptions.length
        ) {
          const tempInscriptions = result.data.inscriptions;
          setInscriptionId(params?.get("inscription"));
          queryParams.inscription_id = params.get("inscription");
          setInscription(
            tempInscriptions.filter(
              (a) => a.inscription_id === params.get("inscription")
            )[0]
          );
        }
      }
      setLoading(false);
    } catch (e: any) {
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }, [walletDetails, page, params]);

  useEffect(() => {
    if (
      walletDetails?.connected &&
      walletDetails.ordinal_address &&
      !inscriptions
    ) {
      console.log("fetching wallet ins...");
      fetchWalletInscriptions();
    }
  }, [walletDetails, page, params, inscriptions]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
  };
  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setPage(value);
    setInscriptions(null);
  };

  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center w-full">
        <div className="flex-1">
          <CustomButton
            loading={loading}
            disabled={!inscriptions || !inscriptions.length || locked}
            text={`${"Choose Inscription To Reinscribe"}`}
            hoverBgColor="hover:bg-accent_dark"
            hoverTextColor="text-white"
            bgColor="bg-accent"
            textColor="text-white"
            className="transition-all w-full rounded"
            onClick={() => !locked && handleOpen()} // Add this line to make the button functional
          />
        </div>
        {inscription && inscriptionId && (
          <div className="pl-2">
            <CardContent
              inscriptionId={inscriptionId}
              content_type={inscription.content_type}
              className="w-[60px]"
            />
          </div>
        )}
      </div>
      <Modal open={open} onClose={handleClose}>
        <div className="absolute top-0 bottom-0 right-0 left-0 bg-black bg-opacity-90">
          <div className="relative center w-full h-screen  min-h-full min-w-full">
            <div
              className={`card_div p-2 h-[99vh] center flex-wrap overflow-y-auto min-w-full`}
            >
              <div className="absolute right-5 top-5">
                <CustomButton
                  text="Close"
                  onClick={() => handleClose()}
                  bgColor="bg-red-600"
                  hoverBgColor="bg-red-800"
                />
              </div>
              <div className="pt-6 text-white  min-h-full min-w-full">
                <div className="SortSearchPages py-6 flex flex-wrap justify-between">
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
                <div className="py-6 min-h-full min-w-full">
                  {inscriptions?.length ? (
                    <div className="flex justify-normal items-center overflow-auto flex-wrap min-h-full min-w-full">
                      {inscriptions.map((i) => (
                        <div
                          onClick={() => {
                            if (
                              i?.valid ||
                              i?.cbrc_valid ||
                              (i?.reinscriptions &&
                                i.reinscriptions.find((a) => a.valid))
                            ) {
                            } else {
                              setInscriptionId(i.inscription_id);
                              setInscription(i);
                              handleClose();
                            }
                          }}
                          key={i.inscription_id}
                          className={`relative p-6 md:w-6/12 lg:w-3/12  2xl:w-2/12 w-full cursor-pointer `}
                        >
                          <div
                            className={`border xl:border-2 border-accent  rounded-xl shadow-xl p-3 ${
                              inscriptionId === i.inscription_id
                                ? "bg-accent_dark"
                                : "bg-secondary"
                            }`}
                          >
                            <div className="content-div h-[60%] rounded overflow-hidden relative">
                              <CardContent
                                inscriptionId={i.inscription_id}
                                content_type={i.content_type}
                                inscription={i}
                              />
                            </div>
                            <div
                              className={`h-[40%] flex flex-col justify-end `}
                            >
                              <div className="py-2 mb-2 center">
                                <div className="flex-1">
                                  <h5 className=" text-sm font-bold tracking-tight text-white">
                                    #{i.inscription_number}
                                  </h5>
                                  {inscriptionId === i.inscription_id && (
                                    <p>SELECTED</p>
                                  )}
                                  {i?.valid ||
                                    i?.cbrc_valid ||
                                    (i?.reinscriptions &&
                                      i.reinscriptions.find((a) => a.valid) && (
                                        <p className="bg-red-800 text-red-200 p-x text-center uppercase font-bold">
                                          This Sat might have a valid token
                                        </p>
                                      ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      {loading ? (
                        <div className="text-white center py-16">
                          <CircularProgress size={20} color="inherit" />
                        </div>
                      ) : (
                        <div className="text-center py-16">
                          No inscriptions found
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Reinscription;
