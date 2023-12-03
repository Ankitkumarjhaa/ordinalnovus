"use client";
import { useWalletAddress } from "bitcoin-wallet-adapter";
import React, { useCallback, useEffect, useState } from "react";
import CollectionForm from "./CollectionForm";
import { ICollection } from "@/types";
import { fetchCollections } from "@/apiHelper/fetchCollection";
import { CircularProgress } from "@mui/material";
import CollectionHero from "./CollectionHero";

function ListCollection() {
  const walletDetails = useWalletAddress();
  const [loading, setLoading] = useState(true);
  const [unpublishedColl, setUnpublishedColl] = useState<ICollection | null>(
    null
  );

  const fetchUnpublishedCollection = useCallback(async () => {
    if (!walletDetails) return;
    setLoading(true);
    const result = await fetchCollections({
      wallet: walletDetails?.ordinal_address,
      live: false,
    });
    if (result?.data?.collections && result.data.collections.length > 0) {
      setUnpublishedColl(result?.data?.collections[0]);
    }
    setLoading(false);
  }, [walletDetails]);

  useEffect(() => {
    fetchUnpublishedCollection();
  }, [walletDetails]);

  return (
    <div className="py-16 min-h-[40vh]">
      {walletDetails && walletDetails.connected ? (
        <div className="">
          {loading ? (
            <div className="text-white center min-h-[30vh]">
              <CircularProgress color="inherit" size={20} />
            </div>
          ) : (
            <>
              {unpublishedColl ? (
                <>
                  <CollectionHero
                    data={unpublishedColl}
                    fetchUnpublishedCollection={fetchUnpublishedCollection}
                  />
                </>
              ) : (
                <CollectionForm
                  fetchUnpublishedCollection={fetchUnpublishedCollection}
                />
              )}
            </>
          )}
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
