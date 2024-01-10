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
  setMode,
  inscriptionId,
  setInscriptionId,
}: {
  inscription: IInscription | null;
  setInscription: any;
  setMode: any;
  inscriptionId: string;
  setInscriptionId: any;
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
      const params = {
        wallet: walletDetails?.ordinal_address,
        page_size: page_size,
        page,
        inscription_number: Number(search),
        sort: "inscription_number:-1",
      };

      const result = await fetchInscriptions(params);
      if (result && result.data) {
        setInscriptions(result.data.inscriptions);
        setTotal(result.data.pagination.total);
      }
      setLoading(false);
    } catch (e: any) {
      setLoading(false);
    }
  }, [walletDetails, page]);

  useEffect(() => {
    if (
      walletDetails?.connected &&
      walletDetails.ordinal_address &&
      !inscriptions
    ) {
      fetchWalletInscriptions();
    }
    if (params?.get("inscription") && inscriptions) {
      setInscriptionId(params?.get("inscription"));
      setInscription(
        inscriptions.filter(
          (a) => a.inscription_id === params.get("inscription")
        )[0]
      );
      setMode("reinscribe");
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
            disabled={!inscriptions || !inscriptions.length}
            text={`${"Choose Inscription To Reinscribe"}`}
            hoverBgColor="hover:bg-accent_dark"
            hoverTextColor="text-white"
            bgColor="bg-accent"
            textColor="text-white"
            className="transition-all w-full rounded"
            onClick={handleOpen} // Add this line to make the button functional
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
        <div
          className="absolute top-0 bottom-0 right-0 left-0 bg-black bg-opacity-90"
          onClick={() => handleClose()}
        >
          <div className="relative center w-full h-screen">
            {/* TODO: Handle images and texts and videos on large */}
            <div
              className={`card_div p-2 h-[90vh] center flex-wrap overflow-y-auto`}
            >
              <div className="pt-16 text-white">
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
                <div className="py-6">
                  {inscriptions?.length ? (
                    <div className="flex justify-normal items-center overflow-auto flex-wrap">
                      {inscriptions.map((i) => (
                        <div
                          onClick={() => {
                            setInscriptionId(i.inscription_id);
                            setInscription(i);
                            setMode("reinscribe");
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
