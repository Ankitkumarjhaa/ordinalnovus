"use client";
import React, { useState, useEffect } from "react";
import { IInscription } from "@/types/Ordinals";
import CustomCard from "@/components/elements/CustomCardSmall";
import { useRouter } from "next/navigation";
import CardContent from "@/components/elements/CustomCardSmall/CardContent";
import { shortenString } from "@/utils";
import { useSelector } from "react-redux";
import { RootState } from "@/stores";
import { CircularProgress } from "@mui/material";
import { fetchInscriptions } from "@/apiHelper/fetchInscriptions";
import { useWalletAddress } from "bitcoin-wallet-adapter";

function AccountPage() {
  const [inscriptions, setInscriptions] = useState<IInscription[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [profile, setProfile] = useState<IInscription | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const walletDetails = useWalletAddress();

  useEffect(() => {
    if (walletDetails && !inscriptions.length) {
      if (walletDetails.connected && walletDetails.ordinal_address) {
        setLoading(true);
        const fetchData = async () => {
          const params = {
            wallet: walletDetails.ordinal_address,
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
        };

        fetchData();
      }
    }
  }, [walletDetails, inscriptions]);

  return (
    <div className="pt-16 text-white">
      <div className="profile w-full flex items-center border-b-2 py-6 border-accent">
        <div className="w-[100px]">
          {inscriptions?.length && profile?.inscription_id ? (
            <CardContent
              inscriptionId={profile?.inscription_id}
              content_type={profile?.content_type}
            />
          ) : (
            <CardContent
              inscriptionId="9d0ad29ef2923df9d598a1a890ead36ebbe44f1f1d77d93efa21325806311f28i0"
              content_type="image/gif"
            />
          )}
        </div>
        <div className="pl-4">
          <p className="text-white text-sm">{walletDetails.ordinal_address}</p>
          <p className="text-gray-400 text-xs">
            {shortenString(walletDetails.ordinal_address || "")}
          </p>
        </div>
      </div>
      <div className="py-6">
        {inscriptions?.length ? (
          <div>
            {inscriptions?.some(
              (inscription) =>
                inscription.content_type &&
                inscription.content_type.includes("image")
            ) && (
              <div className="pb-16">
                <h2 className="text-2xl font-bold ">Image Inscriptions</h2>
                <div className="center flex-wrap">
                  {inscriptions
                    .filter(
                      (inscription) =>
                        inscription.content_type &&
                        inscription.content_type.includes("image")
                    )
                    .map((item) => (
                      <div
                        key={item.inscription_id}
                        className="w-3/12 relative"
                      >
                        <CustomCard
                          number={item.inscription_number}
                          key={item.inscription_id}
                          inscriptionId={item.inscription_id + ""}
                          content_type={item.content_type}
                          inscription={item}
                          showCollection={true}
                        />
                      </div>
                    ))}
                </div>
              </div>
            )}

            {inscriptions?.some(
              (inscription) =>
                inscription.content_type &&
                inscription.content_type.includes("video")
            ) && (
              <div className="pb-16">
                <h2 className="text-2xl font-bold ">Video Inscriptions</h2>
                <div className="center flex-wrap">
                  {inscriptions
                    .filter(
                      (inscription) =>
                        inscription.content_type &&
                        inscription.content_type.includes("video")
                    )
                    .map((item) => (
                      <div
                        key={item.inscription_id}
                        className="w-3/12 relative"
                      >
                        <CustomCard
                          number={item.inscription_number}
                          key={item.inscription_id}
                          inscriptionId={item.inscription_id + ""}
                          content_type={item.content_type}
                          inscription={item}
                          showCollection={true}
                        />
                      </div>
                    ))}
                </div>
              </div>
            )}

            {inscriptions?.some(
              (inscription) =>
                inscription.content_type &&
                inscription.content_type.includes("text")
            ) && (
              <div className="pb-16">
                <h2 className="text-2xl font-bold ">Text Inscriptions</h2>
                <div className="center flex-wrap">
                  {inscriptions
                    .filter(
                      (inscription) =>
                        inscription.content_type &&
                        inscription.content_type.includes("text")
                    )
                    .map((item) => (
                      <div
                        key={item.inscription_id}
                        className="w-3/12 relative"
                      >
                        <CustomCard
                          number={item.inscription_number}
                          key={item.inscription_id}
                          inscriptionId={item.inscription_id + ""}
                          content_type={item.content_type}
                          inscription={item}
                          showCollection={true}
                        />
                      </div>
                    ))}
                </div>
              </div>
            )}

            {inscriptions?.some(
              (inscription) =>
                !["image", "video", "text"].some(
                  (type) =>
                    inscription.content_type &&
                    inscription.content_type.includes(type)
                )
            ) && (
              <div className="pb-16">
                <h2 className="text-2xl font-bold ">Other Inscriptions</h2>
                <div className="center flex-wrap">
                  {inscriptions
                    .filter(
                      (inscription) =>
                        !["image", "video", "text"].some(
                          (type) =>
                            inscription.content_type &&
                            inscription.content_type.includes(type)
                        )
                    )
                    .map((item) => (
                      <div
                        key={item.inscription_id}
                        className="w-3/12 relative"
                      >
                        <CustomCard
                          number={item.inscription_number}
                          key={item.inscription_id}
                          inscriptionId={item.inscription_id + ""}
                          content_type={item.content_type}
                          inscription={item}
                          showCollection={true}
                        />
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
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
