"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { IInscription } from "@/types";
import CustomCard from "@/components/elements/CustomCardSmall";
import { useRouter } from "next/navigation";
import CardContent from "@/components/elements/CustomCardSmall/CardContent";
import { shortenString } from "@/utils";
import { CircularProgress } from "@mui/material";
import { fetchInscriptions } from "@/apiHelper/fetchInscriptions";
import { useWalletAddress } from "bitcoin-wallet-adapter";
import Link from "next/link";
import InscriptionDisplay from "@/components/elements/InscriptionDisplay";

function AccountPage() {
  const [inscriptions, setInscriptions] = useState<IInscription[] | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [profile, setProfile] = useState<IInscription | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const walletDetails = useWalletAddress();

  const fetchData = useCallback(async () => {
    try {
      const params = {
        wallet: walletDetails?.ordinal_address,
        page_size: 100,
        page: 1,
      };

      const result = await fetchInscriptions(params);
      if (result && result.data) {
        // Do something with the fetched data
        setProfile(
          result.data.inscriptions.filter(
            (a) => a?.content_type && a?.content_type.includes("image")
          )[0]
        );
        setInscriptions(result.data.inscriptions);
        setTotal(result.data.pagination.total);
      }
      setLoading(false);
    } catch (e: any) {
      setLoading(false);
    }
  }, [walletDetails]);

  useEffect(() => {
    if (
      walletDetails?.connected &&
      walletDetails.ordinal_address &&
      !inscriptions &&
      loading
    ) {
      fetchData();
    }
  }, [walletDetails, inscriptions, loading]);

  useEffect(() => {
    if (!walletDetails?.connected && !loading) {
      return router.push("/");
    }
  }, [walletDetails, loading]);

  return (
    <div className="pt-16 text-white">
      <div className="profile w-full flex flex-wrap items-center border-b-2 py-6 border-accent">
        <div className="w-[100px]">
          {inscriptions?.length && profile?.inscription_id ? (
            <CardContent
              inscriptionId={profile?.inscription_id}
              content_type={profile?.content_type}
              inscription={profile}
            />
          ) : (
            <CardContent
              inscriptionId="9d0ad29ef2923df9d598a1a890ead36ebbe44f1f1d77d93efa21325806311f28i0"
              content_type="image/gif"
            />
          )}
        </div>
        <div className="pl-4">
          <p className="text-white text-sm hidden lg:block">
            {walletDetails?.ordinal_address}
          </p>
          <p className="text-gray-400 text-xs lg:hidden">
            {shortenString(walletDetails?.ordinal_address || "")}
          </p>
        </div>
        <div className="flex-1 flex justify-center lg:justify-end">
          <Link href="/dashboard/add-collection">
            <p className="px-4 py-1 bg-bitcoin text-yellow-900">
              Add Collection
            </p>
          </Link>
        </div>
      </div>
      <div className="py-6">
        {inscriptions?.length ? (
          <InscriptionDisplay
            data={inscriptions}
            loading={loading}
            pageSize={100}
          />
        ) : (
          <>
            {loading ? (
              <div className="flex items-center justify-center h-screen">
                <CircularProgress size={60} />
              </div>
            ) : (
              <div className="text-center py-16">No Inscriptions Found</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default AccountPage;
