"use client";
import { FetchCBRCBalance } from "@/apiHelper/getCBRCWalletBalance";
import CustomButton from "@/components/elements/CustomButton";
import CustomInput from "@/components/elements/CustomInput";
import CustomSelector from "@/components/elements/CustomSelector";
import { useSignTx } from "bitcoin-wallet-adapter";
import { AppDispatch, RootState } from "@/stores";
import { fetchFees } from "@/utils";
import axios from "axios";
import { useWalletAddress } from "bitcoin-wallet-adapter";
import moment from "moment";
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addNotification } from "@/stores/reducers/notificationReducer";
import ShowOrders from "./showOrders";
import mixpanel from "mixpanel-browser";
import updateOrder from "@/apiHelper/updateOrder";
import { useRouter } from "next/navigation";
const options = [
  // { value: "deploy", label: "DEPLOY" },
  { value: "transfer", label: "TRANSFER" },
  // { value: "mint", label: "MINT" },
];

function Crafter() {
  const { loading: signLoading, result, error, signTx: sign } = useSignTx();

  const router = useRouter();

  const [feeRate, setFeeRate] = useState<number>(0);
  const [defaultFeeRate, setDefaultFeerate] = useState(0);
  const [rep, setRep] = useState(1);
  const walletDetails = useWalletAddress();
  const fees = useSelector((state: RootState) => state.general.fees);
  const dispatch = useDispatch<AppDispatch>();
  const [loading, setLoading] = useState(false);

  const [content, setContent] = useState("");
  const [op, setOp] = useState("transfer");
  const [tick, setTick] = useState("none");
  const [amt, setAmt] = useState(1);
  const [cbrcs, setCbrcs] = useState<any>(null);
  const [files, setFiles] = useState<any>([]);

  const [unsignedPsbtBase64, setUnsignedPsbtBase64] = useState<string>("");
  const [action, setAction] = useState<string>("dummy");
  const [order_result, setorderresult] = useState<any | null>(null);

  useEffect(() => {
    if (!walletDetails && fees) {
      setUnsignedPsbtBase64("");
      setorderresult(null);
      setCbrcs([]);
    }
  }, [walletDetails, fees]);

  useEffect(() => {
    const shouldFetch =
      !fees ||
      !fees.lastChecked ||
      moment().diff(moment(fees.lastChecked), "minutes") >= 10;
    if (shouldFetch) {
      fetchFees(dispatch);
    }
  }, [dispatch]);

  useEffect(() => {
    if (fees?.fastestFee) {
      setFeeRate(fees.fastestFee);
      setDefaultFeerate(fees.fastestFee);
    }
  }, [fees]);

  const fetchCbrcBrc20 = useCallback(async () => {
    try {
      if (!walletDetails?.ordinal_address) return;
      const params = {
        address: walletDetails.ordinal_address,
      };

      const bal_result = await FetchCBRCBalance(params);
      if (bal_result && bal_result.data) {
        // console.log({ data: bal_result.data });
        const tick_options = bal_result.data.map((a) => ({
          value: a.tick,
          label: a.tick,
          limit: a.amt,
        }));
        // console.log({ tick_options });

        setTick(tick_options[0].value);
        setCbrcs(tick_options);
      }
    } catch (e: any) {}
  }, [walletDetails]);

  useEffect(() => {
    if (walletDetails?.connected && walletDetails.ordinal_address) {
      fetchCbrcBrc20();
    }
  }, [walletDetails]);

  const handleFileChange = (event: any) => {
    const selectedFiles = Array.from(event.target.files)
      .filter(
        (file: any) => file.size <= 3 * 1024 * 1024 // 3 MB
      )
      .slice(0, 10); // max of 10 files

    const fileDataPromises = selectedFiles.map((file: any) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const data = {
            file: {
              type: file.type,
              size: file.size,
              name: file.name,
            },
            dataURL: reader.result,
          };
          resolve(data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    Promise.all(fileDataPromises)
      .then((fileDataArray) => {
        // console.log(fileDataArray, "FSA");
        return setFiles(fileDataArray);
      })
      .catch((error) => {
        console.error("Error reading files:", error);
      });
  };

  function textToFileData(text: string, filename: string) {
    const base64EncodedData = btoa(unescape(encodeURIComponent(text)));
    const dataURI = `data:text/plain;base64,${base64EncodedData}`;

    return {
      file: {
        type: "text/plain",
        size: base64EncodedData.length,
        name: filename,
      },
      tick,
      amt,
      op,
      dataURL: dataURI,
    };
  }

  const handleUpload = async () => {
    if (!walletDetails || !walletDetails?.ordinal_address) {
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
      if (!tick || !amt || !feeRate) {
        dispatch(
          addNotification({
            id: new Date().valueOf(),
            message: "Missing Critical Info like Tick or Amt or Fee",
            open: true,
            severity: "error",
          })
        );
        return;
      }

      if (rep > 1 && content) {
        dispatch(
          addNotification({
            id: new Date().valueOf(),
            message: "Leave Content Empty to mint multiple items",
            open: true,
            severity: "error",
          })
        );
        return;
      }
      setLoading(true);
      let fallbackDataArray = [];
      for (let i = 0; i < rep; i++) {
        const fallbackData = textToFileData(
          `${amt} ${tick}`,
          `CBRC-20:${op}:${tick}=${amt}.txt`
        );
        fallbackDataArray.push(fallbackData);
      }

      const BODY = {
        files: files && files.length > 0 ? files : fallbackDataArray,
        receive_address: walletDetails?.ordinal_address,
        payment_address: walletDetails?.cardinal_address,
        publickey: walletDetails?.cardinal_pubkey,
        fee_rate: feeRate,
        wallet: walletDetails?.wallet,
        metaprotocol: "cbrc",
      };

      const { data } = await axios.post(
        "/api/v2/inscribe/create-cbrc-order",
        BODY
      );
      // console.log({ data });
      setUnsignedPsbtBase64(data.psbt);
      setorderresult(data);

      setLoading(false);
      mixpanel.track("Crafter Psbt Created", {
        order_id: data.inscriptions[0].order_id,
        wallet: walletDetails?.ordinal_address,
        // Additional properties if needed
      });
    } catch (error: any) {
      mixpanel.track("Error", {
        ordinal_address: walletDetails.ordinal_address,
        cardinal_address: walletDetails.cardinal_address,
        ordinal_pubkey: walletDetails.ordinal_pubkey,
        cardinal_pubkey: walletDetails.cardinal_pubkey,
        wallet: walletDetails.wallet,
        wallet_name: walletDetails.wallet,
        message: error.response.data.message,
        tag: `Crafter PSBT Error`,
        // Additional properties if needed
      });
      setLoading(false);
      console.error("Error uploading files:", error);
      dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: error.response.data.message || error.message,
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
    inputs.push({
      address: walletDetails.cardinal_address,
      publickey: walletDetails.cardinal_pubkey,
      sighash: 1,
      index: [0],
    });

    const options: any = {
      psbt: unsignedPsbtBase64,
      network: "Mainnet",
      action,
      inputs,
    };
    // console.log(options, "OPTIONS");

    await sign(options);
  }, [action, unsignedPsbtBase64]);

  const broadcast = async (signedPsbt: string) => {
    try {
      const broadcast_res = await updateOrder(
        order_result.inscriptions[0].order_id,
        signedPsbt
      );
      setLoading(false);
      // Track successful broadcast
      mixpanel.track("Broadcast Success", {
        action: action, // Assuming 'action' is defined in your component
        txid: broadcast_res.txid,
        pay_address: walletDetails?.cardinal_address,
        receive_address: walletDetails?.ordinal_address,
        publickey: walletDetails?.cardinal_pubkey,
        wallet: walletDetails?.wallet,
        fee_rate: feeRate,
        // Additional properties if needed
      });
      window.open(`https://mempool.space/tx/${broadcast_res.txid}`, "_blank");
      dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: `Broadcasted ${action} Tx Successfully`,
          open: true,
          severity: "success",
        })
      );
      setUnsignedPsbtBase64("");
      setorderresult(null);
      dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: `Txid: ${broadcast_res.txid}`,
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
          message: "Error broadcasting tx",
          open: true,
          severity: "error",
        })
      );
    }
  };

  useEffect(() => {
    // Handling Wallet Sign Results/Errors
    if (result) {
      // Handle successful result from wallet sign
      console.log("Sign Result:", result);
      // dispatch(
      //   addNotification({
      //     id: new Date().valueOf(),
      //     message: "Tx signed successfully",
      //     open: true,
      //     severity: "success",
      //   })
      // );

      if (result) {
        broadcast(result);
      }

      // Additional logic here
    }

    if (error) {
      mixpanel.track("Error", {
        tag: `wallet sign error ${action} psbt`,
        order_id: order_result.inscriptions[0].order_id,
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

  return (
    <div className="center min-h-[60vh] flex-col">
      {walletDetails ? (
        <>
          <div className="bg-secondary p-6 rounded-lg shadow-2xl">
            <h2 className="uppercase font-bold tracking-wider pb-6">
              Inscribe CBRC
            </h2>
            <div className="w-full center pb-4">
              <CustomSelector
                label="Operation"
                value={op}
                options={options}
                onChange={setOp}
                widthFull={true}
              />
            </div>

            {cbrcs && cbrcs.length && op === "transfer" ? (
              <>
                <div className="w-full center pb-4">
                  <CustomSelector
                    label="Tick"
                    value={tick}
                    options={cbrcs}
                    onChange={setTick}
                    widthFull={true}
                  />
                </div>
                <p>
                  MAX: {cbrcs?.find((a: any) => a.value === tick).limit} {tick}
                </p>
                <div className="center py-2">
                  <CustomInput
                    value={amt.toString()}
                    placeholder="Amount Of Tokens"
                    endAdornmentText={tick.toUpperCase()}
                    onChange={(new_content) => setAmt(Number(new_content))}
                    helperText={
                      amt <= 0 ||
                      (cbrcs?.find((a: any) => a.value === tick)?.limit &&
                        amt > cbrcs?.find((a: any) => a.value === tick).limit)
                        ? `Wrong Amount. Max is: ${
                            cbrcs?.find((a: any) => a.value === tick).limit
                          }`
                        : ""
                    }
                    error={
                      amt <= 0 ||
                      (cbrcs?.find((a: any) => a.value === tick)?.limit &&
                        amt > cbrcs?.find((a: any) => a.value === tick).limit)
                    }
                    fullWidth
                  />
                </div>
                <div className="center py-2">
                  <CustomInput
                    value={rep.toString()}
                    placeholder="Amount to mint"
                    onChange={(new_content) => setRep(Number(new_content))}
                    fullWidth
                    endAdornmentText=" Inscription"
                    startAdornmentText="Mint "
                    helperText={
                      rep <= 0 || rep > 25
                        ? "You can mint 1-25 inscriptions at a time."
                        : ""
                    }
                    error={rep <= 0 || rep > 25}
                  />
                </div>
              </>
            ) : (
              <></>
            )}
            {/* <div className="center py-2">
          <CustomInput
            multiline
            value={content}
            placeholder="Any Content here. By default Token & Amt will be used."
            onChange={(new_content) => setContent(new_content)}
            fullWidth
          />
        </div> */}
            <div className="center py-2">
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
            {unsignedPsbtBase64 && order_result ? (
              <div className="pt-3">
                <p className="text-center pb-3">SAT {order_result.total_fee}</p>
                <p className="text-center pb-3">
                  ${order_result.total_fees_in_dollars.toFixed(2)}
                </p>
                <div className="w-full">
                  <CustomButton
                    loading={loading || signLoading}
                    text={`Complete Payment`}
                    hoverBgColor="hover:bg-accent_dark"
                    hoverTextColor="text-white"
                    bgColor="bg-accent"
                    textColor="text-white"
                    className="transition-all w-full rounded uppercase tracking-widest"
                    onClick={() => signTx()} // Add this line to make the button functional
                  />
                </div>
              </div>
            ) : (
              <div className="w-full">
                <CustomButton
                  loading={loading}
                  text={`Create ${op}`}
                  hoverBgColor="hover:bg-accent_dark"
                  hoverTextColor="text-white"
                  bgColor="bg-accent"
                  textColor="text-white"
                  className="transition-all w-full rounded uppercase tracking-widest"
                  onClick={() => handleUpload()} // Add this line to make the button functional
                />
              </div>
            )}
          </div>
          <div className="w-full">{walletDetails && <ShowOrders />}</div>
        </>
      ) : (
        <div className="text-center text-sm">Connect wallet to continue</div>
      )}
    </div>
  );
}

export default Crafter;
