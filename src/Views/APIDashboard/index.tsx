"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useWalletAddress } from "bitcoin-wallet-adapter";
import { FetchApikey } from "@/apiHelper/fetchApikey";
import { IApikeyResponse } from "@/types";
import { CreateApikey } from "@/apiHelper/createApikey";
import { useDispatch } from "react-redux";
import { addNotification } from "@/stores/reducers/notificationReducer";
import { copyToClipboard } from "@/utils";
import mixpanel from "mixpanel-browser";

function HomePage() {
  const dispatch = useDispatch();
  const walletDetails = useWalletAddress();
  const [checking, setChecking] = useState(false);
  const [apikey, setApikey] = useState<IApikeyResponse | null>(null);

  const checkApikey = useCallback(async () => {
    if (!walletDetails || !walletDetails.connected) return;
    setChecking(true);

    const apikeyResult = await FetchApikey({
      walletId: walletDetails.ordinal_address,
    });

    if (apikeyResult && apikeyResult.success) {
      setApikey(apikeyResult.data);
    }
    setChecking(false);
  }, [walletDetails]);

  const createButton = useCallback(async () => {
    if (walletDetails && walletDetails.ordinal_address) {
      const createRes = await CreateApikey({
        walletId: walletDetails.ordinal_address,
      });
      // Mixpanel Tracking for API Key Creation
      mixpanel.track("API Key Created", {
        wallet: walletDetails.ordinal_address,
        // Additional properties if needed
      });
      if (createRes && createRes.success) {
        await checkApikey();
        dispatch(
          addNotification({
            id: new Date().valueOf(),
            message: "APIKey created successfully",
            open: true,
            severity: "success",
          })
        );
      } else {
        dispatch(
          addNotification({
            id: new Date().valueOf(),
            message: createRes?.error || "",
            open: true,
            severity: "error",
          })
        );
      }
    }
  }, [walletDetails]);

  useEffect(() => {
    if (
      walletDetails &&
      walletDetails.connected &&
      walletDetails.ordinal_address
    ) {
      checkApikey();
    }
  }, [walletDetails]);

  if (walletDetails?.connected && !checking)
    return (
      <>
        {!apikey ? (
          <div className="px-6 min-h-[40vh]">
            <button
              onClick={() => createButton()}
              className="px-4 cursor-pointer py-2 bg-green-800 text-white rounded"
            >
              Create APIKey
            </button>
          </div>
        ) : (
          <div className="px-6 w-full  min-h-[40vh]">
            <p className="">
              Your apikey is :{" "}
              <span
                className="bg-accent text-white px-3 py-1 cursor-pointer"
                onClick={() => {
                  copyToClipboard(apikey.details.apiKey);
                  dispatch(
                    addNotification({
                      id: new Date().valueOf(),
                      message: "Copied",
                      open: true,
                      severity: "success",
                    })
                  );
                }}
              >
                {apikey.details.apiKey}
              </span>
            </p>
            <div className="flex justify-center md:justify-start items-center w-full flex-wrap">
              <div className="p-2 w-full md:w-6/12 lg:w-4/12">
                <div className="bg-gray-500 text-black rounded flex justify-between items-center">
                  <span className="p-2 text-white">Tier: </span>
                  <span className="text-3xl text-white bg-indigo-600 p-2">
                    {apikey.userType}
                  </span>{" "}
                </div>
              </div>
              <div className="p-2 w-full md:w-6/12 lg:w-4/12">
                <div className="bg-gray-500 text-black rounded flex justify-between items-center">
                  <span className="p-2 text-white">Used This Hour: </span>
                  <span className="text-3xl text-white bg-indigo-600 p-2">
                    {apikey.usage}
                  </span>{" "}
                </div>
              </div>
              <div className="p-2 w-full md:w-6/12 lg:w-4/12">
                <div className="bg-gray-500 text-black rounded flex justify-between items-center">
                  <span className="p-2 text-white">Rate Limit Per Hour: </span>
                  <span className="text-3xl text-white bg-indigo-600 p-2">
                    {apikey.rateLimit}
                  </span>{" "}
                </div>
              </div>
              <div className="p-2 w-full md:w-6/12 lg:w-4/12">
                <div className="bg-gray-500 text-black rounded flex justify-between items-center">
                  {/* <span className="p-2 text-white">Rate Limit Per Hour: </span> */}
                  <span className="w-full text-center capitalize text-white bg-indigo-600 p-2">
                    {apikey.expirationDate}
                  </span>{" "}
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  else
    return (
      <p className="text-center py-2 bg-gray-700 cursor-not-allowed text-white my-2  min-h-[40vh]">
        {checking ? "Checking..." : "Connect wallet to create your APIKEY"}
      </p>
    );
}

export default HomePage;
