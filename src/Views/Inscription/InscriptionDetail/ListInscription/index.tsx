"use client";
import CustomButton from "@/components/elements/CustomButton";
import { addNotification } from "@/stores/reducers/notificationReducer";
import { IInscription } from "@/types";
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/stores";
import getUnsignedListingPsbt from "@/apiHelper/getUnsignedListingPsbt";

import {
  calculateBTCCostInDollars,
  convertBtcToSat,
  convertSatToBtc,
} from "@/utils";
import { useWalletAddress, useSignTx } from "bitcoin-wallet-adapter";
import listInscription from "@/apiHelper/listInscription";
import { useRouter } from "next/navigation";
import mixpanel from "mixpanel-browser";
import deleteListing from "@/apiHelper/deleteListing";
import validTokenWithImageRequirement from "@/serverActions/validTokenWithImageRequirement";
type InscriptionProps = {
  data: IInscription;
};

function ListInscription({ data }: InscriptionProps) {
  const dispatch = useDispatch();
  const router = useRouter();
  const walletDetails = useWalletAddress();
  const { loading: signLoading, result, error, signTx: sign } = useSignTx();

  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [unsignedPsbtBase64, setUnsignedPsbtBase64] = useState("");

  const btcPrice = useSelector(
    (state: RootState) => state.general.btc_price_in_dollar
  );
  const [price, setPrice] = useState(
    data?.listed_price ? convertSatToBtc(data?.listed_price) : "0"
  );

  const list = useCallback(async () => {
    if (data?.inscription_id && data?.inscription_number) {
      if (
        !walletDetails ||
        !walletDetails.cardinal_address ||
        !walletDetails.ordinal_address ||
        !walletDetails.wallet
      ) {
        dispatch(
          addNotification({
            id: new Date().valueOf(),
            message: "Connect wallet to continue",
            open: true,
            severity: "error",
          })
        );
        return;
      }
      try {
        setLoading(true);
        const validationRes = await validTokenWithImageRequirement(data);
        if (!validationRes.success) {
          dispatch(
            addNotification({
              id: new Date().valueOf(),
              message: validationRes.message,
              open: true,
              severity: "error",
            })
          );
          setLoading(false);
          return;
        }
        const result = await getUnsignedListingPsbt({
          inscription_id: data.inscription_id,
          price: convertBtcToSat(Number(price)),
          receive_address: walletDetails.cardinal_address,
          wallet: walletDetails.wallet,
          publickey: walletDetails.ordinal_pubkey,
        });

        console.debug(result, "RESULT");
        if (result.ok && result?.unsigned_psbt_base64) {
          mixpanel.track("Listing PSBT Generated", {
            inscription_id: data.inscription_id,
            wallet: walletDetails.ordinal_address,
            inscription: data.inscription_id,
            price: convertBtcToSat(Number(price)),
            receive_address: walletDetails.cardinal_address,
            wallet_name: walletDetails.wallet,
            publickey: walletDetails.ordinal_pubkey,
          });
          setUnsignedPsbtBase64(result.unsigned_psbt_base64);
        } else {
          mixpanel.track("Error", {
            inscription_id: data.inscription_id,
            message: result.message || "Error creating listing psbt",
            tag: "listing psbt error",
            wallet: walletDetails.ordinal_address,
            inscription: data.inscription_id,
            price: convertBtcToSat(Number(price)),
            receive_address: walletDetails.cardinal_address,
            wallet_name: walletDetails.wallet,
            publickey: walletDetails.ordinal_pubkey,
          });
          setUnsignedPsbtBase64("");
          throw Error(result.message);
        }
      } catch (e: any) {
        mixpanel.track("Error", {
          inscription_id: data.inscription_id,
          message:
            e?.response?.data?.message ||
            e?.message ||
            e ||
            "Error creating listing psbt",
          tag: "listing psbt error catch",
          wallet: walletDetails.ordinal_address,
          inscription: data.inscription_id,
          price: convertBtcToSat(Number(price)),
          receive_address: walletDetails.cardinal_address,
          wallet_name: walletDetails.wallet,
          publickey: walletDetails.ordinal_pubkey,
        });
        setLoading(false);
        dispatch(
          addNotification({
            id: new Date().valueOf(),
            message: e.message || "Some error occurred",
            open: true,
            severity: "error",
          })
        );
      }
    }
  }, [data, dispatch, price, walletDetails]);

  const signTx = async () => {
    if (!walletDetails) {
      dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: "Connect wallet to proceed",
          open: true,
          severity: "warning",
        })
      );
      return;
    }
    const options: any = {
      psbt: unsignedPsbtBase64,
      network: "Mainnet",
      action: "sell",
      inputs: [
        {
          address: walletDetails.ordinal_address,
          publickey: walletDetails.ordinal_pubkey,
          sighash: 131,
          index: [0],
        },
      ],
    };

    await sign(options);
  };

  const listOrdinal = async (signedPsbt: string) => {
    try {
      if (!walletDetails) {
        dispatch(
          addNotification({
            id: new Date().valueOf(),
            message: "Connect wallet to proceed",
            open: true,
            severity: "warning",
          })
        );
        return;
      }

      const result = await listInscription({
        seller_receive_address: walletDetails.cardinal_address || "",
        price: convertBtcToSat(Number(price)),
        inscription_id: data.inscription_id,
        unsigned_listing_psbt_base64: unsignedPsbtBase64,
        tap_internal_key: walletDetails.ordinal_pubkey || "",
        signed_listing_psbt_base64: signedPsbt,
      });
      if (result.ok) {
        mixpanel.track("Listing Completed", {
          inscription_id: data.inscription_id,
          price: convertBtcToSat(Number(price)),
          collection: data?.official_collection?.name,
          wallet: walletDetails.ordinal_address,
          // Additional properties if needed
        });
        // copy(result.unsigned_psbt_base64);
        setUnsignedPsbtBase64("");
        dispatch(
          addNotification({
            id: new Date().valueOf(),
            message: "Listed successfully",
            open: true,
            severity: "success",
          })
        );
        router.refresh();
        setLoading(false);
      } else {
        setUnsignedPsbtBase64("");
        throw Error(result.message);
      }
    } catch (e: any) {
      mixpanel.track("Error", {
        inscription_id: data.inscription_id,
        message:
          e?.response?.data?.message || e?.message || e || "Listing failed",
        tag: "Listing Error",
        wallet: walletDetails?.ordinal_address,
        // Additional properties if needed
      });
      setLoading(false);
      dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: e.message || "Some error occurred",
          open: true,
          severity: "error",
        })
      );
    }
  };

  const deListOrdinal = async () => {
    try {
      if (!walletDetails) {
        dispatch(
          addNotification({
            id: new Date().valueOf(),
            message: "Connect wallet to proceed",
            open: true,
            severity: "warning",
          })
        );
        return;
      }
      setDeleteLoading(true);
      const result = await deleteListing({
        seller_receive_address: walletDetails.cardinal_address || "",
        inscription_id: data.inscription_id,
        tap_internal_key: walletDetails.ordinal_pubkey || "",
      });
      if (result.ok) {
        mixpanel.track("Listing Removed", {
          inscription_id: data.inscription_id,
          price: convertBtcToSat(Number(price)),
          collection: data?.official_collection?.name,
          wallet: walletDetails.ordinal_address,
          // Additional properties if needed
        });
        // copy(result.unsigned_psbt_base64);
        setUnsignedPsbtBase64("");
        dispatch(
          addNotification({
            id: new Date().valueOf(),
            message: "Listing Removed",
            open: true,
            severity: "success",
          })
        );
        router.refresh();
        setUnsignedPsbtBase64("");
        setLoading(false);
      } else {
        setUnsignedPsbtBase64("");
        throw Error(result.message);
      }
    } catch (e: any) {
      mixpanel.track("Error", {
        inscription_id: data.inscription_id,
        message:
          e?.response?.data?.message ||
          e.message ||
          e ||
          "Error in removing listing",
        tag: "Remove Listing Error",
        wallet: walletDetails?.ordinal_address,
        // Additional properties if needed
      });
      setLoading(false);
      dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: e.message || "Some error occurred",
          open: true,
          severity: "error",
        })
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  useEffect(() => {
    // Handling Leather Wallet Sign Results/Errors
    if (result) {
      // Handle successful result from leather wallet sign
      console.debug("Sign Result:", result);

      if (result) {
        listOrdinal(result);
      }

      // Additional logic here
    }

    if (error) {
      mixpanel.track("Error", {
        inscription_id: data.inscription_id,
        message: error || "Wallet signing failed",
        tag: "wallet sign error listing psbt",
        ordinal_address: walletDetails?.ordinal_address,
        ordinal_pubkey: walletDetails?.ordinal_pubkey,
        cardinal_address: walletDetails?.cardinal_address,
        cardinal_pubkey: walletDetails?.cardinal_pubkey,
        wallet: walletDetails?.ordinal_address,
        wallet_name: walletDetails?.wallet,

        // Additional properties if needed
      });
      // Handle error from leather wallet sign
      console.error(" Sign Error:", error);

      // Turn off loading after handling results or errors
      setLoading(false);
      dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: error.message || "wallet error occurred",
          open: true,
          severity: "error",
        })
      );
      // Additional logic here
    }
  }, [result, error]);

  useEffect(() => {
    if (unsignedPsbtBase64) {
      signTx();
    }
  }, [unsignedPsbtBase64]);

  if (data.in_mempool) {
    return (
      <div className="flex-1 pt-6">
        <CustomButton
          loading={false}
          text={"Sold. Tx in progress..."}
          hoverBgColor="hover:bg-accent_dark"
          hoverTextColor="text-white"
          bgColor="bg-accent"
          textColor="text-white"
          className="transition-all w-full rounded-xl"
          link={true}
          newTab={true}
          href={`https://mempool.space/tx/${data.txid}`}
        />
      </div>
    );
  }

  return (
    <div className="border-b-2   py-6 border-accent">
      {" "}
      <div className="center   pb-6">
        <div className="flex-1 mr-3 border border-white rounded-xl">
          <div className="flex items-center">
            <input
              type="text"
              value={price}
              placeholder="Total List Price in BTC"
              onChange={(e) => {
                const inputVal = e.target.value;
                const isValidInput = /^[0-9]*\.?[0-9]*$/.test(inputVal); // Regex to validate decimal or numeric input

                if (isValidInput) {
                  setPrice(inputVal);
                }
              }}
              className="bg-transparent w-9/12 p-2 focus:outline-none"
            />
            <span className="pl-2 flex text-xs justify-end">
              USD {calculateBTCCostInDollars(Number(price), btcPrice)}
            </span>
          </div>
        </div>
        <div className="flex-1">
          <CustomButton
            loading={loading || signLoading || data.in_mempool}
            text={
              data.listed_price
                ? data.in_mempool
                  ? `In Mempool`
                  : "Update Price"
                : `List Now`
            }
            hoverBgColor="hover:bg-accent_dark"
            hoverTextColor="text-white"
            bgColor="bg-accent"
            textColor="text-white"
            className="transition-all w-full rounded-xl"
            onClick={() => list()} // Add this line to make the button functional
          />
        </div>
      </div>
      {data.listed && (
        <div className="flex-1">
          <CustomButton
            loading={deleteLoading}
            text={data.listed_price ? "Cancel Listing" : ``}
            hoverBgColor="hover:bg-accent_dark"
            hoverTextColor="text-white"
            bgColor="bg-accent"
            textColor="text-white"
            className="transition-all w-full rounded-xl"
            onClick={() => deListOrdinal()} // Add this line to make the button functional
          />
        </div>
      )}
    </div>
  ); // We render the content state variable here
}

export default ListInscription;
