import { addCollection } from "@/apiHelper/addCollection";
import CustomButton from "@/components/elements/CustomButton";
import CustomInput from "@/components/elements/CustomInput";
import isSlugValid from "@/utils/slugValidator";
import { useWalletAddress } from "bitcoin-wallet-adapter";
import React, { useState } from "react";
import { FaPlus, FaDiscord, FaGlobe, FaImage } from "react-icons/fa";

import { FaXTwitter } from "react-icons/fa6";
import Modal from "@mui/material/Modal";
import inscriptionIsValid from "@/utils/inscriptionIdValidator";
import { IInscription } from "@/types";
import CardContent from "@/components/elements/CustomCardSmall/CardContent";
import { addNotification } from "@/stores/reducers/notificationReducer";
import { useDispatch } from "react-redux";
import mixpanel from "mixpanel-browser";
function CollectionForm({
  fetchUnpublishedCollection,
}: {
  fetchUnpublishedCollection: any;
}) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const walletDetails = useWalletAddress();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [discordUrl, setDiscordUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [icon, setIcon] = useState("");
  const [inscription_icon, setInscription_icon] = useState("");
  const [email, setEmail] = useState("");
  const [discordId, setDiscordId] = useState("");
  const [inscriptionErr, setInscriptionErr] = useState("");
  const [inscription, set_inscription] = useState<IInscription | null>(null);

  const [slugErr, setSlugErr] = useState("");

  const slugValidator = async () => {
    if (slug) {
      const isValid = await isSlugValid(slug);
      if (!isValid) {
        setSlugErr("");
      } else {
        setSlugErr(isValid);
      }
    }
  };

  const inscriptionIdValidator = async () => {
    if (inscription_icon) {
      const isValid: any = await inscriptionIsValid(inscription_icon);
      // console.log({ isValid });
      if (isValid && isValid.err) {
        setInscriptionErr(isValid.err);
      } else {
        set_inscription(isValid);
      }
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!walletDetails || !walletDetails.ordinal_address) {
      return dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: "Connect wallet to proceed",
          open: true,
          severity: "warning",
        })
      );
    }
    if (
      !name ||
      !slug ||
      !description ||
      !email ||
      !discordId ||
      (!inscription && !icon)
    ) {
      return dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: "Missing required fields",
          open: true,
          severity: "warning",
        })
      );
    }
    setLoading(true);
    const result = await addCollection({
      name,
      slug,
      description,
      tags: tags ? tags.split(",") : undefined,
      twitter_link: twitterUrl,
      discord_link: discordUrl,
      website_link: websiteUrl,
      blockchain: "btc",
      updated_by: walletDetails?.ordinal_address,
      live: false,
      verified: false,
      type: "official",
      json_uploaded: false,
      icon,
      inscription_icon: inscription?._id || undefined,
      email,
      discord_id: discordId,
    });

    if (result && result?.data?.ok) {
      // Success Tracking
      mixpanel.track("Collection Added", {
        name: name,
        slug: slug,
        wallet: walletDetails.ordinal_address,
        // Additional properties if needed
      });
      setLoading(false);
      fetchUnpublishedCollection();
      dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: "Your Collection has been added.",
          open: true,
          severity: "info",
        })
      );
    } else {
      // Error Tracking for Exception
      mixpanel.track("Error", {
        name: name,
        slug: slug,
        message: result?.error || "Failed to List your collection",
        tag: "collection addition exception",
        wallet: walletDetails.ordinal_address,
        // Additional properties if needed
      });
      setLoading(false);
      dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: result?.error || "Failed to list your collection",
          open: true,
          severity: "error",
        })
      );
    }
    setLoading(false);
  };

  return (
    <div>
      <h2 className="text-white text-3xl capitalize pb-16 font-bold">
        List Your Collection
      </h2>
      <div className="flex justify-between flex-wrap">
        <div className="w-full lg:w-6/12 ">
          <div onClick={handleOpen} className="w-full cursor-pointer">
            {!inscription && !icon ? (
              <div className="bg-primary-dark center  min-h-[400px]">
                <FaPlus className="text-3xl" />
              </div>
            ) : (
              <>
                {inscription && inscription_icon ? (
                  <CardContent
                    inscriptionId={inscription_icon}
                    content_type={inscription.content_type}
                    className="h-full w-full"
                    inscription={inscription}
                  />
                ) : (
                  <>
                    <img src={icon} className="w-full h-full " />
                  </>
                )}
              </>
            )}
          </div>
          <div className="flex justify-between items-center py-3">
            <div className="w-7/12 mb-2">
              <CustomInput
                value={email}
                placeholder="Email*"
                onChange={setEmail}
                fullWidth
              />
            </div>
            <div className="w-4/12 mb-2">
              <CustomInput
                value={discordId}
                placeholder="Discord ID*"
                onChange={setDiscordId}
                fullWidth
              />
            </div>
          </div>
        </div>

        <div className="w-full lg:w-6/12 p-2">
          <div className="mb-4">
            <CustomInput
              value={name}
              placeholder="Name*"
              onChange={setName}
              fullWidth
            />
          </div>
          <div className="my-4">
            <CustomInput
              value={slug}
              placeholder="Slug*"
              onChange={(value) => setSlug(value.toLowerCase())}
              fullWidth
              error={slugErr ? true : false}
              helperText={slugErr}
              onBlur={slugValidator}
            />
          </div>
          <div className="my-4">
            <CustomInput
              value={description}
              placeholder="Description*"
              onChange={setDescription}
              fullWidth
              multiline
            />
          </div>
          <div className="my-4">
            <CustomInput
              value={tags}
              placeholder="Tags (comma separated)"
              onChange={setTags}
              fullWidth
            />
          </div>
          <div className="my-4">
            <CustomInput
              icon={FaXTwitter}
              value={twitterUrl}
              placeholder="Twitter URL"
              onChange={setTwitterUrl}
              fullWidth
            />
          </div>
          <div className="my-4">
            <CustomInput
              icon={FaDiscord}
              value={discordUrl}
              placeholder="Discord URL"
              onChange={setDiscordUrl}
              fullWidth
            />
          </div>
          <div className="mb-2">
            <CustomInput
              icon={FaGlobe}
              value={websiteUrl}
              placeholder="Website URL"
              onChange={setWebsiteUrl}
              fullWidth
            />
          </div>
          <div className="my-6">
            <CustomButton
              text={"Submit Collection Details"}
              onClick={handleSubmit}
            />
          </div>
        </div>
      </div>
      <Modal open={open} onClose={handleClose}>
        <div className="absolute top-0 bottom-0 right-0 left-0 bg-black bg-opacity-90">
          <div className="relative center w-full h-screen">
            <div className={` p-2 h-[70vh] w-full center`}>
              <div className="relative rounded-xl border xl:border-2 border-accent bg-secondary shadow-xl py-16 w-full lg:w-6/12">
                <div className="w-full p-6">
                  <div className="mb-6">
                    <p className="text-sm text-center mb-2">
                      Add an Image URL for cover Image
                    </p>
                    <CustomInput
                      icon={FaImage}
                      value={icon}
                      placeholder="https://"
                      onChange={setIcon}
                      fullWidth
                    />
                  </div>
                  <p className="text-3xl font-bold text-center">OR</p>
                  <div className="my-6">
                    <p className="text-sm text-center mb-2">
                      Add an Inscription as cover Image
                    </p>
                    <CustomInput
                      icon={FaImage}
                      value={inscription_icon}
                      placeholder="be8dd251c1bf293879296af5e825e93e898d317ead21d40051f23ff3750fd9a2i0"
                      onChange={setInscription_icon}
                      fullWidth
                      error={inscriptionErr ? true : false}
                      helperText={inscriptionErr}
                      onBlur={inscriptionIdValidator}
                    />
                  </div>
                  <div className="mb-2 center">
                    <CustomButton
                      loading={loading}
                      text={"Submit"}
                      onClick={handleClose}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default CollectionForm;
