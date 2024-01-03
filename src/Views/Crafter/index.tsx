"use client";
import { FetchCBRCBalance } from "@/apiHelper/getCBRCWalletBalance";
import CustomButton from "@/components/elements/CustomButton";
import CustomInput from "@/components/elements/CustomInput";
import CustomSelector from "@/components/elements/CustomSelector";
import { PayButton } from "bitcoin-wallet-adapter";
import { AppDispatch, RootState } from "@/stores";
import { fetchFees } from "@/utils";
import axios from "axios";
import { useWalletAddress } from "bitcoin-wallet-adapter";
import moment from "moment";
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addNotification } from "@/stores/reducers/notificationReducer";
import ShowOrders from "./showOrders";
const options = [
  // { value: "deploy", label: "DEPLOY" },
  { value: "transfer", label: "TRANSFER" },
  // { value: "mint", label: "MINT" },
];

function Crafter() {
  const [feeRate, setFeeRate] = useState<number>(0);
  const [defaultFeeRate, setDefaultFeerate] = useState(0);
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

  const [payDetails, setPayDetails] = useState<any>(null);

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

      const result = await FetchCBRCBalance(params);
      if (result && result.data) {
        console.log({ data: result.data });
        const tick_options = result.data.map((a) => ({
          value: a.tick,
          label: a.tick,
          limit: a.amt - a.lock,
        }));
        console.log({ tick_options });

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
        console.log(fileDataArray, "FSA");
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
      dataURL: dataURI,
    };
  }

  const handleUpload = async () => {
    try {
      if (!walletDetails?.ordinal_address) {
        dispatch(
          addNotification({
            id: new Date().valueOf(),
            message: "Connect wallet to continue",
            open: true,
            severity: "error",
          })
        );
      }
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
      setLoading(true);
      const fallbackData = textToFileData(
        content || `${amt} ${tick}`,
        `CBRC-20:${op}:${tick}=${amt}.txt`
      );

      const BODY = {
        files: files && files.length > 0 ? files : [fallbackData],
        tick,
        amt,
        content,
        receive_address: walletDetails?.ordinal_address,
        fee_rate: feeRate,
        op,
      };

      const { data } = await axios.post(
        "/api/v2/inscribe/create-cbrc-order",
        BODY
      );
      console.log({ data });
      setPayDetails(data);
      setLoading(false);
    } catch (error: any) {
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

  return (
    <div className="center min-h-[70vh] flex-col">
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

        {cbrcs && op === "transfer" && (
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
            <div className="center py-2">
              <CustomInput
                value={amt.toString()}
                placeholder="Amount Of Tokens"
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
          </>
        )}
        <div className="center py-2">
          <CustomInput
            multiline
            value={content}
            placeholder="Any Content here. By default Token & Amt will be used."
            onChange={(new_content) => setContent(new_content)}
            fullWidth
          />
        </div>
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
        {payDetails ? (
          <div className="pt-3">
            <p className="text-center pb-3">
              ${payDetails.total_fees_in_dollars.toFixed(2)}
            </p>
            <div className="center">
              <PayButton
                receipient={payDetails.funding_address}
                amount={payDetails.total_fee}
                buttonClassname="bg-accent text-white px-4 py-2 rounded center "
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
      <div>
        <ShowOrders />
      </div>
    </div>
  );
}

export default Crafter;
