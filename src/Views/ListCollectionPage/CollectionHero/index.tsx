import { addCollection } from "@/apiHelper/addCollection";
import CustomButton from "@/components/elements/CustomButton";
import CustomInput from "@/components/elements/CustomInput";
import isSlugValid from "@/utils/slugValidator";
import { useWalletAddress } from "bitcoin-wallet-adapter";
import React, { useState } from "react";
import { FaPlus, FaTwitter, FaDiscord, FaGlobe, FaImage } from "react-icons/fa";
import Modal from "@mui/material/Modal";
import inscriptionIsValid from "@/utils/inscriptionIdValidator";
import { ICollection, IInscription } from "@/types";
import CardContent from "@/components/elements/CustomCardSmall/CardContent";
import { addNotification } from "@/stores/reducers/notificationReducer";
import { useDispatch } from "react-redux";
import { deleteCollectionDraft } from "@/apiHelper/deleteCollectionDraft";
import { useRouter } from "next/navigation";

function CollectionHero({
  coll,
  fetchUnpublishedCollection,
}: {
  coll: ICollection;
  fetchUnpublishedCollection: any;
}) {
  const router = useRouter();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  async function handleSubmit() {
    try {
      setLoading(true);
      const result = await deleteCollectionDraft({
        slug: coll.slug,
        updated_by: coll.updated_by || "",
      });

      if (result?.error) {
        dispatch(
          addNotification({
            id: new Date().valueOf(),
            message: result.error,
            open: true,
            severity: "error",
          })
        );
      } else {
        router.push("/creator");
      }
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      console.log({ err });
      dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: "Some error occurred",
          open: true,
          severity: "error",
        })
      );
    }
  }

  return (
    <div>
      <h2 className="text-3xl capitalize pb-16 font-bold">
        Your Collection Draft
      </h2>
      <div className="flex justify-between flex-wrap">
        <div className="w-full lg:w-6/12 ">
          <div className="w-full">
            <>
              {coll.inscription_icon ? (
                <CardContent
                  inscriptionId={coll.inscription_icon.inscription_id}
                  content_type={coll.inscription_icon.content_type}
                  className="h-full w-full"
                />
              ) : (
                <>
                  <img src={coll.icon} className="w-full h-full " />
                </>
              )}
            </>
          </div>
          <div className="flex justify-between items-center py-3">
            <div className="w-7/12 mb-2">
              <p>
                <strong>Email: </strong>
                {coll.email}
              </p>
            </div>
            <div className="w-4/12 mb-2">
              <p>
                <strong>Discord: </strong>
                {coll.discord_id}
              </p>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-6/12 p-2">
          <div className="mb-4">
            <p>
              <strong>Name: </strong>
              {coll.name}
            </p>
          </div>
          <div className="my-4">
            <p>
              <strong>Slug: </strong>/{coll.slug}
            </p>
          </div>
          <div className="my-4">
            <p>
              <strong>Description: </strong>
              {coll.description}
            </p>
          </div>
          <div className="my-4">
            <p>
              <strong>Tags: </strong>
              {coll.tags?.join(" , ")}
            </p>
          </div>
          <div className="my-4">
            <p>
              <strong>Twitter Link: </strong>
              {coll.twitter_link}
            </p>
          </div>
          <div className="my-4">
            <p>
              <strong>Discord Invite: </strong>
              {coll.discord_link}
            </p>
          </div>
          <div className="mb-2">
            <p>
              <strong>Website: </strong>
              {coll.website_link}
            </p>
          </div>
          <div className="my-6">
            <CustomButton
              loading={loading}
              text={"Delete Collection Draft"}
              onClick={handleSubmit}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CollectionHero;
