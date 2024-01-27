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
import Reinscription from "./reinscription";
import { IInscription } from "@/types";
import { useSearchParams } from "next/navigation";
import fetchCollectionBySlug from "@/serverActions/fetchCollectionBySlug";
import { ICbrcToken } from "@/types/CBRC";
import fetchTokenByTick from "@/serverActions/fetchTokenByTick";

const options = [
  // { value: "deploy", label: "DEPLOY" },
  { value: "transfer", label: "TRANSFER" },
  // { value: "mint", label: "MINT" },
];

function Crafter({ mode }: { mode: "cbrc" | "reinscribe" }) {
  const { loading: signLoading, result, error, signTx: sign } = useSignTx();

  const router = useRouter();
  const searchParams = useSearchParams();

  const [customFee, setCustomFee] = useState(false);
  const [feeRate, setFeeRate] = useState<number>(0);
  const [defaultFeeRate, setDefaultFeerate] = useState(0);
  const [rep, setRep] = useState(1);
  const walletDetails = useWalletAddress();
  const fees = useSelector((state: RootState) => state.general.fees);
  const dispatch = useDispatch<AppDispatch>();
  const [loading, setLoading] = useState(false);

  const [tokenInfo, setTokenInfo] = useState<ICbrcToken | null>(null);

  const [content, setContent] = useState("");
  const [op, setOp] = useState("transfer");
  const [tick, setTick] = useState("");
  const [amt, setAmt] = useState(1);
  const [cbrcs, setCbrcs] = useState<any>(null);
  const [files, setFiles] = useState<any>([]);

  const [unsignedPsbtBase64, setUnsignedPsbtBase64] = useState<string>("");
  const [action, setAction] = useState<string>("dummy");
  const [order_result, setorderresult] = useState<any | null>(null);

  const [inscription, setInscription] = useState<IInscription | null>(null);
  const [inscriptionId, setInscriptionId] = useState("");

  const [locked, setLocked] = useState(false);
  const [txLink, setTxLink] = useState("");

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
      setFeeRate(fees.fastestFee + 10);
      setDefaultFeerate(fees.fastestFee + 10);
    }
  }, [fees]);

  const fetchCbrc20 = useCallback(async () => {
    try {
      if (!walletDetails?.ordinal_address) return;
      const params = {
        address: walletDetails.ordinal_address,
      };

      const bal_result = await FetchCBRCBalance(params);
      if (bal_result && bal_result.data) {
        // console.log({ data: bal_result.data });
        const tick_options = bal_result.data
          .filter((a) => a.amt > 0) // Filter out objects where amt is not greater than 0
          .map((a) => ({
            value: a.tick,
            label: a.tick,
            limit: a.amt,
          }));

        // console.log({ tick_options });

        let selectedTick = tick_options[0].value;

        if (searchParams?.has("inscription") && searchParams.has("tickAmt")) {
          console.log("setting locked data...");
          const tickAmt = decodeURIComponent(searchParams.get("tickAmt") || "");
          console.log({ tickAmt });
          if (tickAmt?.includes("=")) {
            const [_tick, _amt] = tickAmt?.split("=");
            // console.log({ _tick, _amt });
            if (_tick) {
              selectedTick = _tick;
              // console.log("fetching coll by slug...");
              const isCbrcCollectionRes = await fetchCollectionBySlug(
                _tick.trim().toLowerCase()
              );

              // console.log("got it...");
              if (isCbrcCollectionRes?.collection) {
                setAmt(isCbrcCollectionRes?.collection?.token_amount || 1);
              } else {
                if (!isNaN(Number(_amt))) {
                  setAmt(Number(_amt));
                }
              }
            }

            setOp("transfer");

            if (_tick && !isNaN(Number(_amt))) {
              setLocked(true);
            }
          }
        }

        setTick(selectedTick);
        setCbrcs(tick_options);
      }
    } catch (e: any) {
      console.error(e, "Error in reinscribe, fetchCbrc20 func");
    }
  }, [walletDetails, searchParams]);

  useEffect(() => {
    if (walletDetails?.connected && walletDetails.ordinal_address) {
      fetchCbrc20();
    }
  }, [walletDetails, searchParams]);

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
    let dataURI = `data:text/plain;charset=utf-8;base64,${base64EncodedData}`;
    let type = "text/plain;charset=utf-8";

    if (
      mode === "reinscribe" &&
      tick &&
      !inscription?.content_type?.includes("text") &&
      inscriptionId
    ) {
      type = "text/html;charset=utf-8";
      const html = `<!DOCTYPE html>
<html>
<head>
    <title>Image in Iframe</title>
</head>
<body style="margin: 0; padding: 0;">
    <img id="dynamicImage" style="width: 100%; height: 100%; object-fit: cover; image-rendering: pixelated;" 
         src="/content/${inscription?.inscription_id}" />
    <div style="position: absolute; top: 20%; width: 100%; background-color: rgba(0, 0, 0, 0.5); text-align: center;">
        <p style="color: white; margin: 10px 0;">${tick.toUpperCase()} ${op} Inscription</p>
        <p style="color: white; margin: 10px 0;">Created on Ordinalnovus</p>
    </div>
</body>
</html>
`;

      const base64EncodedData = btoa(html);
      dataURI = `data:text/html;charset=utf-8;base64,${base64EncodedData}`;
      filename = `CBRC-20:${op}:${tick}=${amt}.html`;
    }

    return {
      file: {
        type,
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
    if ((!inscription || !tick || !amt || !op) && mode === "reinscribe") {
      dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: "Some info is missing for reinscription",
          open: true,
          severity: "error",
        })
      );
      return;
    }
    if (
      inscription?.valid ||
      inscription?.cbrc_valid ||
      (inscription?.reinscriptions &&
        inscription.reinscriptions.find((a) => a.valid))
    ) {
      dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: "This Sat probably has a valid CBRC Token on it.",
          open: true,
          severity: "error",
        })
      );
      return;
    }
    try {
      if (!tick || !options || options.length === 0 || !amt || !feeRate) {
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

      if (
        inscription &&
        tick &&
        inscription.official_collection &&
        inscription.official_collection.metaprotocol === "cbrc" &&
        tick !== inscription?.official_collection.slug
      ) {
        dispatch(
          addNotification({
            id: new Date().valueOf(),
            message: "The inscription is not part of this collection",
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
        inscription_id: inscription?.inscription_id,
        ordinal_publickey: walletDetails.ordinal_pubkey,
        cardinal_publickey: walletDetails.cardinal_pubkey,
      };

      const url = !inscription
        ? "/api/v2/inscribe/create-cbrc-order"
        : "/api/v2/inscribe/reinscribe";
      const { data } = await axios.post(url, BODY);
      // console.log({ data });
      setUnsignedPsbtBase64(data.psbt);
      setorderresult(data);

      setLoading(false);
      mixpanel.track("Crafter Psbt Created", {
        order_id: data.inscriptions[0].order_id,
        wallet: walletDetails?.ordinal_address,
        mode,
        tick,
        amt,
        op,
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
    if (mode === "reinscribe") {
      inputs.push({
        address: walletDetails.ordinal_address,
        publickey: walletDetails.ordinal_pubkey,
        sighash: 1,
        index: [0],
      });

      Array.from({ length: order_result.inputs - 1 }, (_, idx) => {
        inputs.push({
          address: walletDetails.cardinal_address,
          publickey: walletDetails.cardinal_pubkey,
          sighash: 1,
          index: [idx + 1],
        });
      });
    } else {
      inputs.push({
        address: walletDetails.cardinal_address,
        publickey: walletDetails.cardinal_pubkey,
        sighash: 1,
        index: [0],
      });
    }

    const options: any = {
      psbt: unsignedPsbtBase64,
      network: "Mainnet",
      action: mode !== "reinscribe" ? "dummy" : "others",
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
        mode,
        // Additional properties if needed
      });
      if (mode === "cbrc") {
        setUnsignedPsbtBase64("");
        setorderresult(null);
        setRep(1);
        setAmt(1);
        await fetchCbrc20();
        window.open(`https://mempool.space/tx/${broadcast_res.txid}`, "_blank");
      } else {
        setTxLink(`https://mempool.space/tx/${broadcast_res.txid}`);
      }
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

  const fetchToken = useCallback(async () => {
    try {
      if (op === "mint") {
        const fetchTokenRes = await fetchTokenByTick(tick);
        if (fetchTokenRes && fetchTokenRes.success) {
          setTokenInfo(fetchTokenRes.cbrc);
          console.log({ token: fetchTokenRes });
          if (fetchTokenRes.cbrc.supply !== fetchTokenRes.cbrc.max)
            setAmt(fetchTokenRes.cbrc.lim);
          else {
            dispatch(
              addNotification({
                id: new Date().valueOf(),
                message: `This token has been completely minted`,
                open: true,
                severity: "error",
              })
            );
          }
        }
      } else if (op === "transfer") {
        // console.log("fetching coll by slug...");
        const isCbrcCollectionRes = await fetchCollectionBySlug(
          tick.trim().toLowerCase()
        );

        // console.log("got it...");
        if (isCbrcCollectionRes?.collection) {
          if (mode === "cbrc") {
            // dispatch(
            //   addNotification({
            //     id: new Date().valueOf(),
            //     message: `This token should be used only with reinscriber.`,
            //     open: true,
            //     severity: "error",
            //   })
            // );
            // setTick("");
            // return;
          } else if (mode === "reinscribe") {
            setAmt(inscription?.official_collection?.token_amount || 1);
          }
        }
      }
    } catch (e: any) {
      console.log(e, "FETCHTOKEN");
    }
  }, [tick, op]);

  useEffect(() => {
    if (tick && tick.length === 4 && op) {
      fetchToken();
    }
  }, [tick, op]);

  return (
    <div className="center min-h-[60vh] flex-col w-full">
      {walletDetails ? (
        <div className="w-full center flex-col">
          <div className="bg-secondary p-6 rounded-lg shadow-2xl min-w-xl w-5/12">
            {/* {walletDetails.wallet === "Unisat" && mode === "reinscribe" && (
              <p className="bg-red-500 text-white py-1 px-4 text-center uppercase tracking-wider font-bold mb-2">
                DO NOT USE UNISAT FOR REINSCRIPTIONS
              </p>
            )} */}
            <h2 className="uppercase font-bold tracking-wider text-xl text-center">
              {mode === "cbrc" ? "Inscribe CBRC" : `Attach ${tick} CBRC Token`}
            </h2>
            <hr className="mb-5 mt-3 bg-white" />
            {mode === "cbrc" && (
              <div className="w-full center pb-4">
                <CustomSelector
                  label="Operation"
                  value={op}
                  options={options}
                  onChange={setOp}
                  widthFull={true}
                />
              </div>
            )}
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
                  You Have: {cbrcs?.find((a: any) => a.value === tick)?.limit}{" "}
                  {tick}
                </p>
                <div className={`center py-2`}>
                  <CustomInput
                    value={amt.toString()}
                    placeholder="Amount Of Tokens"
                    endAdornmentText={tick.toUpperCase()}
                    onChange={(new_content) =>
                      !locked && setAmt(Number(new_content))
                    }
                    helperText={
                      amt <= 0 ||
                      (cbrcs?.find((a: any) => a.value === tick)?.limit &&
                        amt > cbrcs?.find((a: any) => a.value === tick).limit)
                        ? `Wrong Amount. Max is: ${
                            cbrcs?.find((a: any) => a.value === tick)?.limit
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
                {mode !== "reinscribe" && (
                  <div className="center py-2">
                    <CustomInput
                      disabled={locked}
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
                )}
              </>
            ) : (
              <></>
            )}
            {op === "mint" && (
              <>
                <div className="center py-2">
                  <CustomInput
                    value={tick}
                    placeholder={`Tick`}
                    onChange={(new_content) => setTick(new_content)}
                    fullWidth
                  />
                </div>
                <div className={`center py-2`}>
                  <CustomInput
                    value={amt.toString()}
                    placeholder="Amount Of Tokens"
                    endAdornmentText={tick.toUpperCase()}
                    onChange={(new_content) =>
                      !locked && setAmt(Number(new_content))
                    }
                    fullWidth
                  />
                </div>
                {mode !== "reinscribe" && (
                  <div className="center py-2">
                    <CustomInput
                      disabled={locked}
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
                )}
              </>
            )}
            {mode === "reinscribe" && (
              <Reinscription
                inscription={inscription}
                setInscription={setInscription}
                inscriptionId={inscriptionId}
                setInscriptionId={setInscriptionId}
                locked={locked}
              />
            )}
            {inscription?.valid ||
              inscription?.cbrc_valid ||
              (inscription?.reinscriptions &&
                inscription.reinscriptions.find((a) => a.valid) && (
                  <p className="bg-red-800 text-red-200 p-x text-center uppercase font-bold">
                    This Sat might have a valid token
                  </p>
                ))}
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
                      onClick={() => {
                        setFeeRate(rate);

                        if (idx === 2) {
                          setCustomFee(true);
                        } else {
                          setCustomFee(false);
                        }
                      }}
                      className={`p-2 flex-1 ${
                        feeRate === rate
                          ? "border border-white cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                      key={idx}
                    >
                      <p className="text-lg text-center">
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
            {unsignedPsbtBase64 && order_result ? (
              <>
                {txLink ? (
                  <CustomButton
                    loading={loading}
                    text={`${tick} Reinscribed Successfully`}
                    hoverBgColor="hover:bg-accent_dark"
                    hoverTextColor="text-white"
                    bgColor="bg-accent"
                    textColor="text-white"
                    className="transition-all w-full rounded uppercase tracking-widest"
                    link={true}
                    href={txLink}
                    newTab={true}
                  />
                ) : (
                  <div className="pt-3">
                    <p className="text-center pb-3">
                      SAT {order_result.total_fee}
                    </p>
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
                )}
              </>
            ) : (
              <div className="w-full">
                <CustomButton
                  disabled={!tick || !amt}
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
        </div>
      ) : (
        <div className="text-center text-sm">Connect wallet to continue</div>
      )}
    </div>
  );
}

export default Crafter;
