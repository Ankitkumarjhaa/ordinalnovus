"use client";
import CustomButton from "@/components/elements/CustomButton";
import { addNotification } from "@/stores/reducers/notificationReducer";
import { IInscription } from "@/types";
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/stores";
import { calculateBTCCostInDollars, convertSatToBtc } from "@/utils";
import getUnsignedBuyPsbt from "@/apiHelper/getUnsignedBuyPsbt";
import FeePicker from "@/components/elements/FeePicker";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useWalletAddress, useSignTx } from "bitcoin-wallet-adapter";
import mixpanel from "mixpanel-browser";
import updateTokenPrice from "@/apiHelper/updatePrice";
type InscriptionProps = {
  data: IInscription;
};

function BuyInscription({ data }: InscriptionProps) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { loading: signLoading, result, error, signTx: sign } = useSignTx();

  const [loading, setLoading] = useState<boolean>(false);

  const [unsignedPsbtBase64, setUnsignedPsbtBase64] = useState<string>("");
  const [inputLength, setInputLength] = useState(0);
  const [action, setAction] = useState<string>("");
  const [feeRate, setFeeRate] = useState(0);

  const btcPrice = useSelector(
    (state: RootState) => state.general.btc_price_in_dollar
  );

  //wallet
  const walletDetails = useWalletAddress();

  const buy = useCallback(async () => {
    if (
      !walletDetails ||
      !walletDetails.cardinal_address ||
      !walletDetails.ordinal_address ||
      !walletDetails.wallet ||
      !walletDetails.cardinal_pubkey
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
      console.log({ feeRate }, "in BUY Function");
      setLoading(true);
      const result = await getUnsignedBuyPsbt({
        inscription_id: data.inscription_id,
        pay_address: walletDetails.cardinal_address,
        receive_address: walletDetails.ordinal_address,
        publickey: walletDetails.cardinal_pubkey,
        wallet: walletDetails.wallet,
        fee_rate: feeRate,
        price: data.listed_price || 0,
      });

      if (result.ok && result.unsigned_psbt_base64) {
        if (result.for === "dummy") {
          mixpanel.track("Dummy Psbt Created", {
            action: result.for || "dummy", // Assuming 'result.for' is part of your response
            inscription_id: data.inscription_id,
            wallet: walletDetails.ordinal_address,
            // Additional properties if needed
          });
          dispatch(
            addNotification({
              id: new Date().valueOf(),
              message: "Creating dummy UTXO",
              open: true,
              severity: "info",
            })
          );
          setAction("dummy");

          setUnsignedPsbtBase64(result.unsigned_psbt_base64);
        } else {
          setAction("buy");
          setInputLength(result?.input_length || 0);

          setUnsignedPsbtBase64(result.unsigned_psbt_base64);

          mixpanel.track("Buy Psbt Created", {
            action: result.for || "buy", // Assuming 'result.for' is part of your response
            inscription_id: data.inscription_id,
            wallet: walletDetails.ordinal_address,
            // Additional properties if needed
          });
        }
      } else {
        throw Error(result.message);
      }

      return 0;
    } catch (e: any) {
      // Track error in buy attempt
      mixpanel.track("Error", {
        tag: `Buy Attempt Error`,
        message: e.message || e || "Error creating buy psbt",
        ordinal_address: walletDetails.ordinal_address,
        cardinal_address: walletDetails.cardinal_address,
        ordinal_pubkey: walletDetails.ordinal_pubkey,
        cardinal_pubkey: walletDetails.cardinal_pubkey,
        wallet: walletDetails.wallet,
        wallet_name: walletDetails.wallet,
        // Additional properties if needed
      });
      setLoading(false);
      dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: e.message || e,
          open: true,
          severity: "error",
        })
      );
    }
  }, [walletDetails, data, feeRate]);

  const broadcast = async (signedPsbt: string) => {
    const inscription = { ...data };
    try {
      const { data } = await axios.post("/api/v2/order/broadcast", {
        signed_psbt: signedPsbt,
      });
      setLoading(false);
      router.refresh();
      // Track successful broadcast
      mixpanel.track("Broadcast Success", {
        action: action, // Assuming 'action' is defined in your component
        txid: data.data.txid,
        inscription_id: inscription.inscription_id,
        collection: inscription?.official_collection?.name,
        pay_address: walletDetails?.cardinal_address,
        receive_address: walletDetails?.ordinal_address,
        publickey: walletDetails?.cardinal_pubkey,
        wallet: walletDetails?.wallet,
        fee_rate: feeRate,
        // Additional properties if needed
      });
      // if (inscription?.listed_price_per_token && inscription?.listed_token)
      //   await updateTokenPrice(
      //     inscription?.listed_token,
      //     action,
      //     (inscription?.listed_price_per_token / 100_000_000) * btcPrice
      //   );
      window.open(`https://mempool.space/tx/${data.data.txid}`, "_blank");
      dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: `Broadcasted ${action} Tx Successfully`,
          open: true,
          severity: "success",
        })
      );
      dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: `Txid: ${data.data.txid}`,
          open: true,
          severity: "success",
        })
      );
    } catch (err: any) {
      // Track error in broadcasting
      mixpanel.track("Error", {
        tag: `Broadcast Error ${action}`,
        message:
          err.response?.data?.message ||
          err.message ||
          err ||
          "Error broadcasting tx",
        ordinal_address: walletDetails?.ordinal_address,
        ordinal_pubkey: walletDetails?.ordinal_pubkey,
        cardinal_address: walletDetails?.cardinal_address,
        cardinal_pubkey: walletDetails?.cardinal_pubkey,
        wallet: walletDetails?.ordinal_address,
        wallet_name: walletDetails?.wallet,
        // Additional properties if needed
      });
      setLoading(false);
      dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: err.response.data.message || "Error broadcasting tx",
          open: true,
          severity: "error",
        })
      );
    }
  };

  const signTx = useCallback(async () => {
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
    let inputs = [];
    if (action === "dummy") {
      inputs.push({
        address: walletDetails.cardinal_address,
        publickey: walletDetails.cardinal_pubkey,
        sighash: 1,
        index: [0],
      });
    } else if (action === "buy") {
      new Array(inputLength).fill(1).map((item: number, idx: number) => {
        if (idx !== 2)
          inputs.push({
            address: walletDetails.cardinal_address,
            publickey: walletDetails.cardinal_pubkey,
            sighash: 1,
            index: [idx],
          });
      });
    }
    const options: any = {
      psbt: unsignedPsbtBase64,
      network: "Mainnet",
      action,
      inputs,
    };
    console.log(options, "OPTIONS");

    await sign(options);
  }, [action, unsignedPsbtBase64]);

  useEffect(() => {
    // Handling Wallet Sign Results/Errors
    if (result) {
      // Handle successful result from wallet sign
      console.log("Sign Result:", result);
      dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: "Tx signed successfully",
          open: true,
          severity: "success",
        })
      );

      if (result) {
        broadcast(result);
      }

      // Additional logic here
    }

    if (error) {
      mixpanel.track("Error", {
        tag: `wallet sign error ${action} psbt`,
        inscription_id: data.inscription_id,
        message: error || "Wallet signing failed",
        ordinal_address: walletDetails?.ordinal_address,
        ordinal_pubkey: walletDetails?.ordinal_pubkey,
        cardinal_address: walletDetails?.cardinal_address,
        cardinal_pubkey: walletDetails?.cardinal_pubkey,
        wallet: walletDetails?.ordinal_address,
        wallet_name: walletDetails?.wallet,
        // Additional properties if needed
      });
      console.error("Sign Error:", error);
      dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: error.message || "Wallet error occurred",
          open: true,
          severity: "error",
        })
      );
      // Additional logic here
    }

    // Turn off loading after handling results or errors
    setLoading(false);
  }, [result, error]);

  useEffect(() => {
    if (unsignedPsbtBase64) {
      signTx();
    }
  }, [unsignedPsbtBase64]);

  return (
    <>
      <div className="w-full  py-6 border-b-2 border-accent">
        {!data.in_mempool && (
          <div>
            <div className="center ">
              <p className="py-1 px-4 font-medium rounded bg-bitcoin text-xs text-yellow-900">
                Selected Fee <strong className="text-lg">{feeRate}</strong>{" "}
                sats/vB
              </p>
            </div>
            <FeePicker onChange={setFeeRate} />
          </div>
        )}
        <CustomButton
          loading={loading}
          disabled={!data.listed}
          text={`${
            action === "dummy"
              ? "Confirm Transaction for Dummy UTXO"
              : data.in_mempool
              ? `Sold. Tx in progress...`
              : `Buy Now ${
                  data?.listed_price
                    ? `for ${convertSatToBtc(
                        Number(data.listed_price)
                      )} BTC USD ${calculateBTCCostInDollars(
                        Number(convertSatToBtc(data.listed_price)),
                        btcPrice
                      )}`
                    : ""
                }`
          }`}
          hoverBgColor="hover:bg-accent_dark"
          hoverTextColor="text-white"
          bgColor="bg-accent"
          textColor="text-white"
          className="transition-all w-full rounded-xl"
          link={data.in_mempool}
          href={`https://mempool.space/tx/${data.txid}`}
          newTab={true}
          onClick={buy} // Add this line to make the button functional
        />
      </div>
    </>
  );
}

export default BuyInscription;
