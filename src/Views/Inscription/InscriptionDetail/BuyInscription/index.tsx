"use client";
import CustomButton from "@/components/elements/CustomButton";
import { addNotification } from "@/stores/reducers/notificationReducer";
import { IInscription } from "@/types";
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/stores";
import {
  base64ToHex,
  calculateBTCCostInDollars,
  convertSatToBtc,
} from "@/utils";
import {
  useLeatherSign,
  useWalletAddress,
  useXverseSign,
} from "bitcoin-wallet-adapter";
import getUnsignedBuyPsbt from "@/apiHelper/getUnsignedBuyPsbt";
import FeePicker from "@/components/elements/FeePicker";
import axios from "axios";
type InscriptionProps = {
  data: IInscription;
};

function BuyInscription({ data }: InscriptionProps) {
  const dispatch = useDispatch();
  const {
    loading: leatherLoading,
    result: leatherResult,
    error: leatherError,
    sign: leatherSign,
  } = useLeatherSign();

  const {
    loading: xverseLoading,
    result: xverseResult,
    error: xverseError,
    sign: xverseSign,
  } = useXverseSign();

  const [loading, setLoading] = useState<boolean>(false);

  const [unsignedPsbtBase64, setUnsignedPsbtBase64] = useState<string>("");
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
      setLoading(true);
      const result = await getUnsignedBuyPsbt({
        inscription_id: data.inscription_id,
        pay_address: walletDetails.cardinal_address,
        receive_address: walletDetails.ordinal_address,
        publickey: walletDetails.cardinal_pubkey,
        wallet: walletDetails.wallet,
        fee_rate: feeRate,
      });

      if (result.ok && result.unsigned_psbt_base64) {
        if (result.for === "dummy") {
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

          console.log(result, "UNSIGNED DUMMY");
        } else {
          setAction("buy");

          setUnsignedPsbtBase64(result.unsigned_psbt_base64);

          console.log(result, "UNSIGNED BUY");
        }
      } else {
        throw Error(result.message);
      }

      return 0;
    } catch (e: any) {
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
  }, [walletDetails, data]);

  const broadcast = async (signedPsbt: string) => {
    try {
      console.log({ signedPsbt });
      const { data } = await axios.post("/api/v2/order/broadcast", {
        signed_psbt: signedPsbt,
      });
      setLoading(false);
      console.log(data);
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
      window.open(`https://mempool.space/tx/${data.data.txid}`, "_blank");
    } catch (err: any) {
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
    let inputs = [];
    if (action === "dummy") {
      inputs.push({
        address: walletDetails.cardinal_address,
        publickey: walletDetails.cardinal_pubkey,
        sighash: 1,
        index: [0],
      });
    } else if (action === "buy") {
      inputs.push({
        address: walletDetails.cardinal_address,
        publickey: walletDetails.cardinal_pubkey,
        sighash: 1,
        index: [0],
      });
      inputs.push({
        address: walletDetails.cardinal_address,
        publickey: walletDetails.cardinal_pubkey,
        sighash: 1,
        index: [1],
      });
      inputs.push({
        address: walletDetails.cardinal_address,
        publickey: walletDetails.cardinal_pubkey,
        sighash: 1,
        index: [3],
      });
      inputs.push({
        address: walletDetails.cardinal_address,
        publickey: walletDetails.cardinal_pubkey,
        sighash: 1,
        index: [4],
      });
      inputs.push({
        address: walletDetails.cardinal_address,
        publickey: walletDetails.cardinal_pubkey,
        sighash: 1,
        index: [5],
      });
    }
    if (walletDetails.wallet === "Leather") {
      const options: any = {
        psbt: base64ToHex(unsignedPsbtBase64),
        network: "Mainnet",
        action,
        inputs,
      };
      console.log(options, "OPTIONS");

      await leatherSign(options);
    } else if (walletDetails.wallet === "Xverse") {
      const options: any = {
        psbt: unsignedPsbtBase64,
        network: "Mainnet",
        action,
        inputs,
      };
      console.log(options, "OPTIONS");

      await xverseSign(options);
    }
  }, [action, unsignedPsbtBase64]);

  useEffect(() => {
    // Handling Leather Wallet Sign Results/Errors
    if (leatherResult) {
      // Handle successful result from leather wallet sign
      console.log("Leather Sign Result:", leatherResult);

      if (leatherResult) {
        broadcast(leatherResult);
        // listOrdinal(leatherResult);
      }
      dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: "Leather wallet transaction successful",
          open: true,
          severity: "success",
        })
      );
      // Additional logic here
    }

    if (leatherError) {
      // Handle error from leather wallet sign
      console.error("Leather Sign Error:", leatherError);
      dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: leatherError.message || "Leather wallet error occurred",
          open: true,
          severity: "error",
        })
      );
      // Additional logic here
    }

    // Handling Xverse Wallet Sign Results/Errors
    if (xverseResult) {
      // Handle successful result from xverse wallet sign
      console.log("Xverse Sign Result:", xverseResult);
      if (xverseResult.psbtBase64) {
        broadcast(xverseResult.psbtBase64);
        // listOrdinal(xverseResult.psbtBase64);
      }
      dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: "Leather wallet transaction successful",
          open: true,
          severity: "success",
        })
      );
      dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: "Xverse wallet transaction successful",
          open: true,
          severity: "success",
        })
      );
      // Additional logic here
    }

    if (xverseError) {
      // Handle error from xverse wallet sign
      console.error("Xverse Sign Error:", xverseError);
      dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: xverseError.message || "Xverse wallet error occurred",
          open: true,
          severity: "error",
        })
      );
      // Additional logic here
    }

    // Turn off loading after handling results or errors
    setLoading(false);
  }, [leatherResult, leatherError, xverseResult, xverseError]);

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
          disabled={!data.signed_psbt}
          text={`${
            action === "dummy"
              ? "Confirm Transaction for Dummy UTXO"
              : data.in_mempool
              ? `In Mempool...`
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
          onClick={buy} // Add this line to make the button functional
        />
      </div>
    </>
  );
}

export default BuyInscription;
