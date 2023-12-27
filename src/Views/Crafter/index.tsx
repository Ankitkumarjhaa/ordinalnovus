"use client";
import { FetchCBRCBalance } from "@/apiHelper/getCBRCWalletBalance";
import CustomButton from "@/components/elements/CustomButton";
import CustomInput from "@/components/elements/CustomInput";
import CustomSelector from "@/components/elements/CustomSelector";
import FeePicker from "@/components/elements/FeePicker";
import { AppDispatch, RootState } from "@/stores";
import { fetchFees } from "@/utils";
import { useWalletAddress } from "bitcoin-wallet-adapter";
import moment from "moment";
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
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

  const [content, setContent] = useState("");
  const [op, setOp] = useState("transfer");
  const [tick, setTick] = useState("none");
  const [amt, setAmt] = useState(1);
  const [cbrcs, setCbrcs] = useState<any>(null);

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

  return (
    <div className="center min-h-[70vh]">
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
        <div className="w-full">
          <CustomButton
            // loading={loading || signLoading || data.in_mempool}
            text={`Create ${op}`}
            hoverBgColor="hover:bg-accent_dark"
            hoverTextColor="text-white"
            bgColor="bg-accent"
            textColor="text-white"
            className="transition-all w-full rounded uppercase tracking-widest"
            // onClick={() => list()} // Add this line to make the button functional
          />
        </div>
      </div>
    </div>
  );
}

export default Crafter;
