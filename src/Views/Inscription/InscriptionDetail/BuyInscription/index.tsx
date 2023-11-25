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
import getUnsignedBuyPsbt from "@/apiHelper/getUnsignedBuyPsbt";
import FeePicker from "@/components/elements/FeePicker";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useWalletAddress, useSignTx } from "bitcoin-wallet-adapter";
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
          setInputLength(result?.input_length || 0);

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
      router.refresh();
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
