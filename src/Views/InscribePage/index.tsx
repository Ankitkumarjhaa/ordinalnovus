"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import InscribePreviewCard from "./InscribePreviewCard";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/stores";
import { fetchFees } from "@/utils";
import moment from "moment";
import { useWalletAddress } from "bitcoin-wallet-adapter";

const InscribePage = () => {
  const walletDetails = useWalletAddress();
  const [files, setFiles] = useState<any>([]);
  const [lowPostage, setLowPostage] = useState(false);
  const [receiveAddress, setReceiveAddress] = useState("");
  const [fee, setFee] = useState<number>(0);
  const [responseData, setResponseData] = useState(null);

  const fees = useSelector((state: RootState) => state.general.fees);

  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const shouldFetch =
      !fees ||
      !fees.lastChecked ||
      moment().diff(moment(fees.lastChecked), "minutes") >= 10;
    if (shouldFetch) {
      fetchFees(dispatch);
    }
    if (walletDetails && walletDetails.ordinal_address)
      setReceiveAddress(walletDetails.ordinal_address);
  }, [dispatch, walletDetails]);

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

  const handleUpload = async () => {
    try {
      const response = await axios.post("/api/v2/inscribe/create-order", {
        files,
        lowPostage,
        receiveAddress: receiveAddress || walletDetails?.ordinal_address,
        fee,
      });
      setResponseData(response.data);
    } catch (error) {
      console.error("Error uploading files:", error);
    }
  };

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFee(Number(event.target.value));
  };

  return (
    <div className="p-4 min-h-[40vh]">
      <div className="relative py-6">
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          accept="
        image/apng, image/flac, image/gif, text/html, image/jpeg, image/jpg, audio/mp3,
        application/pdf, image/png, image/svg+xml, text/plain, audio/wav, video/webm,
        image/webp, video/mp4, model/stl, model/glb, image/avif, application/yaml, text/yaml,
        text/plain, application/json, text/javascript, text/css"
          className="hidden"
          id="file-input"
        />

        <label
          htmlFor="file-input"
          className="cursor-pointer bg-accent py-3 rounded px-6 text-white"
        >
          Choose Files
        </label>
      </div>

      <input
        type="text"
        placeholder="Receive Address"
        value={receiveAddress}
        onChange={(e) => setReceiveAddress(e.target.value)}
        className="mb-4 p-2 border w-full md:w-6/12 border-gray-300 focus:outline-none "
      />
      {/* <input
        type="text"
        placeholder="Fee"
        value={fee}
        onChange={(e) => setFee(e.target.value)}
        className="mb-4 p-2 border w-full md:w-6/12 border-gray-300 focus:outline-none"
      /> */}
      <label className="flex items-center mb-4">
        <input
          type="checkbox"
          checked={lowPostage}
          onChange={(e) => setLowPostage(e.target.checked)}
        />
        <span className="ml-2">Low Postage</span>
      </label>
      {fees && (
        <div className="flex items-center flex-wrap">
          <div
            className={`pointer-cursor option p-2 bg-secondary border-2 border-accent rounded m-2 ${
              fee === fees.fastestFee ? "selected bg-accent text-white" : ""
            }`}
            onClick={() => setFee(fees.fastestFee)}
          >
            Fastest Fee: {fees.fastestFee}
          </div>
          <div
            className={`pointer-cursor option p-2 bg-secondary border-2 border-accent rounded m-2 ${
              fee === fees.halfHourFee ? "selected bg-accent text-white" : ""
            }`}
            onClick={() => setFee(fees.halfHourFee)}
          >
            Half Hour Fee: {fees.halfHourFee}
          </div>
          <div
            className={`pointer-cursor option p-2 bg-secondary border-2 border-accent rounded m-2 ${
              fee === fees.hourFee ? "selected bg-accent text-white" : ""
            }`}
            onClick={() => setFee(fees.hourFee)}
          >
            Hour Fee: {fees.hourFee}
          </div>
          <div
            className={`pointer-cursor option p-2 bg-secondary border-2 border-accent rounded m-2 ${
              fee === fees.economyFee ? "selected bg-accent text-white" : ""
            }`}
            onClick={() => setFee(fees.economyFee)}
          >
            Economy Fee: {fees.economyFee}
          </div>
        </div>
      )}
      <input
        type="range"
        min={5}
        max={100}
        value={fee}
        onChange={handleSliderChange}
        className="slider pr-6"
      />
      <button
        onClick={handleUpload}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Upload
      </button>
      {/* {responseData && (
        <pre className="mt-4 p-4 bg-gray-100 rounded">
          {JSON.stringify(responseData, null, 2)}
        </pre>
      )} */}
      <div className="preview-container">
        <p className="text-3xl font-bold py-6">Preview</p>
        <div className="flex flex-wrap justify-start items-center">
          {files.map((fileData: any, index: number) => (
            <InscribePreviewCard
              key={index}
              file={fileData.file}
              dataURL={fileData.dataURL}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default InscribePage;
