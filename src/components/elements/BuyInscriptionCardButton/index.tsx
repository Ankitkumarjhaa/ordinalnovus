"use client";
import CustomButton from "@/components/elements/CustomButton";
import { addNotification } from "@/stores/reducers/notificationReducer";
import { IInscription } from "@/types";
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/stores";
import getUnsignedBuyPsbt from "@/apiHelper/getUnsignedBuyPsbt";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useWalletAddress, useSignTx } from "bitcoin-wallet-adapter";
import mixpanel from "mixpanel-browser";
import updateTokenPrice from "@/apiHelper/updatePrice";
import CustomInput from "../CustomInput";
type InscriptionProps = {
  data: IInscription;
};

function BuyInscriptionCardButton({ data }: InscriptionProps) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { loading: signLoading, result, error, signTx: sign } = useSignTx();

  const [loading, setLoading] = useState<boolean>(false);

  const [customFee, setCustomFee] = useState(false);
  const [unsignedPsbtBase64, setUnsignedPsbtBase64] = useState<string>("");
  const [inputLength, setInputLength] = useState(0);
  const [action, setAction] = useState<string>("");
  const [feeRate, setFeeRate] = useState(0);
  const [defaultFeeRate, setDefaultFeerate] = useState(0);

  const btcPrice = useSelector(
    (state: RootState) => state.general.btc_price_in_dollar
  );

  const fees = useSelector((state: RootState) => state.general.fees);

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

    if (feeRate < Math.min(10, defaultFeeRate - 50)) {
      dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: "Fee Rate too low.",
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
        wallet: walletDetails.cardinal_address,
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

      router.refresh();
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
      setLoading(false);
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

  useEffect(() => {
    if (fees?.fastestFee) {
      setFeeRate(fees.fastestFee + 10);
      setDefaultFeerate(fees.fastestFee + 10);
    }
  }, [fees]);

  return (
    <>
      <div className="w-full  pt-6 pb-2 bg-primary">
        {!data.in_mempool ? (
          <div className="py-3">
            <p className="text-sm text-center ">
              Choose Transfer Speed (Fee Rate)
            </p>
            <div className="flex justify-between py-2">
              {new Array(3).fill(1).map((_, idx) => {
                // Calculating feeRate for each speed option
                let rate = defaultFeeRate;
                if (idx === 0) {
                  rate = defaultFeeRate - 5; // Slow
                } else if (idx === 1) {
                  rate = defaultFeeRate; // Fast
                } else {
                  rate = defaultFeeRate + 10; // Fastest
                }

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setFeeRate(rate);

                      if (idx === 2) {
                        setCustomFee(true);
                      } else {
                        setCustomFee(false);
                      }
                    }}
                    className={`p-2 flex-1  ${
                      feeRate === rate
                        ? "border  border-white cursor-not-allowed"
                        : "cursor-pointer"
                    }${idx === 0 ? "flex-grow-0" : "flex-grow"}`}
                    style={{ width: idx === 2 ? "100%" : "auto" }}
                  >
                    <p className="text-lg  text-white text-center">
                      {idx === 0 ? "Slow" : idx === 1 ? "Fast" : "Custom"}
                    </p>
                    <p className="text-xs text-center">{rate} s/vB</p>
                  </div>
                );
              })}
            </div>
            {customFee ? (
              <div>
                <CustomInput
                  value={feeRate.toString()}
                  placeholder="Fee Rate"
                  onChange={(fee) => setFeeRate(Number(fee))}
                  helperText={
                    feeRate < Math.min(10, defaultFeeRate - 40)
                      ? "Fee too low"
                      : feeRate > defaultFeeRate + 200
                      ? "Fee too high - make sure you are okay with it"
                      : ""
                  }
                  error={true}
                  endAdornmentText=" sats / vB"
                  startAdornmentText="Fee Rate"
                  fullWidth
                />
              </div>
            ) : (
              <></>
            )}
          </div>
        ) : (
          <div className="py-16"></div>
        )}
        <CustomButton
          loading={loading}
          disabled={!data.listed || data.in_mempool}
          text={`${data.in_mempool ? `Sold. Tx in Progress...` : `Buy Now `}`}
          hoverBgColor="hover:bg-accent"
          hoverTextColor="text-white"
          bgColor="bg-accent_dark"
          textColor="text-white"
          className="transition-all w-full py-4 font-bold bg-opacity-40 rounded"
          // link={data.in_mempool}
          // href={`https://mempool.space/tx/${data.txid}`}
          // newTab={true}
          icon={data.in_mempool ? PendingIcon : null}
          onClick={buy}
          border="border"
          borderColor="border-[#9102F0]" // Add this line to make the button functional
        />
      </div>
    </>
  );
}

const PendingIcon = () => {
  return (
    <span className="mr-2 ">
      <img width={30} src="/static-assets/images/pending.gif" />
    </span>
  );
};
export default BuyInscriptionCardButton;
