"use client";
import { useWalletAddress } from "bitcoin-wallet-adapter";
import React from "react";
import CollectionForm from "./CollectionForm";

function ListCollection() {
  const walletDetails = useWalletAddress();
  return (
    <div className="py-16 min-h-[40vh]">
      {walletDetails && walletDetails.connected ? (
        <div className="">
          <CollectionForm />
        </div>
      ) : (
        <div className="tExt-sm text-gray-300 text-center">
          Connect wallet to proceed
        </div>
      )}
    </div>
  );
}

export default ListCollection;
