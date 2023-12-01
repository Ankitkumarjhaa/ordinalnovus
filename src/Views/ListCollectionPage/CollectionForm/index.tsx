import { addCollection } from "@/apiHelper/addCollection";
import CustomButton from "@/components/elements/CustomButton";
import CustomInput from "@/components/elements/CustomInput";
import isSlugValid from "@/utils/slugValidator";
import { useWalletAddress } from "bitcoin-wallet-adapter";
import React, { useEffect, useState } from "react";
import { FaPlus, FaTwitter, FaDiscord, FaGlobe } from "react-icons/fa";

function CollectionForm() {
  const walletDetails = useWalletAddress();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [discordUrl, setDiscordUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");

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

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!walletDetails || !walletDetails.ordinal_address) {
      return;
    }
    const result = await addCollection({
      name,
      slug,
      description,
      tags: tags.split(","),
      twitter_link: twitterUrl,
      discord_link: discordUrl,
      website_link: websiteUrl,
      blockchain: "btc",
      updated_by: walletDetails?.ordinal_address,
      live: false,
      verified: false,
      type: "official",
      json_uploaded: false,
    });

    if (result && result.data.ok) {
    }
  };

  return (
    <div>
      <h2 className="text-3xl capitalize pb-16 font-bold">
        List Your Collection
      </h2>
      <div className="flex justify-between flex-wrap">
        <div className="w-full lg:w-6/12">
          <div className="bg-primary-dark center h-[300px] w-[300px]">
            <FaPlus className="text-3xl" />
          </div>
        </div>
        <div className="w-full lg:w-6/12">
          <div className="mb-2">
            <CustomInput
              value={name}
              placeholder="Name"
              onChange={setName}
              fullWidth
            />
          </div>
          <div className="mb-2">
            <CustomInput
              value={slug}
              placeholder="Slug"
              onChange={(value) => setSlug(value.toLowerCase())}
              fullWidth
              error={slugErr ? true : false}
              helperText={slugErr}
              onBlur={slugValidator}
            />
          </div>
          <div className="mb-2">
            <CustomInput
              value={description}
              placeholder="Description"
              onChange={setDescription}
              fullWidth
              multiline
            />
          </div>
          <div className="mb-2">
            <CustomInput
              value={tags}
              placeholder="Tags (comma separated)"
              onChange={setTags}
              fullWidth
            />
          </div>
          <div className="mb-2">
            <CustomInput
              icon={FaTwitter}
              value={twitterUrl}
              placeholder="Twitter URL"
              onChange={setTwitterUrl}
              fullWidth
            />
          </div>
          <div className="mb-2">
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
          <div className="mb-2">
            <CustomButton text={"Submit"} onClick={handleSubmit} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CollectionForm;
