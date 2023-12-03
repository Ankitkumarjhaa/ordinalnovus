"use client";
import { ICollection } from "@/types";
import React, { useState } from "react";
import { AiFillCheckCircle } from "react-icons/ai";
import { FaDiscord, FaFlag, FaGlobe, FaTwitter } from "react-icons/fa";
import CardContent from "@/components/elements/CustomCardSmall/CardContent";
import { addNotification } from "@/stores/reducers/notificationReducer";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { deleteCollectionDraft } from "@/apiHelper/deleteCollectionDraft";
import CustomButton from "@/components/elements/CustomButton";
type HeroProps = {
  data: ICollection;
  fetchUnpublishedCollection: any;
};
function CollectionHero({ data, fetchUnpublishedCollection }: HeroProps) {
  const router = useRouter();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  async function handleSubmit() {
    try {
      setLoading(true);
      const result = await deleteCollectionDraft({
        slug: data.slug,
        updated_by: data?.updated_by || "",
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
        router.push("/dashboard");
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

  const handleJsonSubmit = async (event: any) => {
    event.preventDefault();
    // Set loading state for this action as well

    const formData = new FormData();
    formData.append("file", event.target.files[0]);
    formData.append("slug", data.slug); // Adding the slug to the formData

    try {
      setUploading(true);
      const response = await fetch("/api/v2/creator/collection/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (response.ok) {
        dispatch(
          addNotification({
            id: new Date().valueOf(),
            message: "File uploaded successfully",
            open: true,
            severity: "success",
          })
        );
        fetchUnpublishedCollection(); // Refresh collection or perform necessary action
      } else {
        dispatch(
          addNotification({
            id: new Date().valueOf(),
            message: result.error || "An error occurred during file upload",
            open: true,
            severity: "error",
          })
        );
      }
      setUploading(false);
    } catch (err) {
      console.error(err);
      dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: "Network error or server is unreachable",
          open: true,
          severity: "error",
        })
      );
    } finally {
      setUploading(false);
    }
  };

  const fileInputRef: any = React.useRef(null);

  const handleFileInputChange = (event: any) => {
    // Check if a file is selected
    if (event.target.files.length > 0) {
      handleJsonSubmit(event); // Submit the form
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef && fileInputRef.current) fileInputRef.current.click(); // Trigger file input
  };

  return (
    <div>
      <h2 className="text-3xl capitalize pb-6 text-center font-bold">
        Your Collection Draft
      </h2>
      <div className="relative h-auto lg:min-h-[40vh] 2xl:max-h-96 rounded-xl overflow-hidden border xl:border-2 border-accent bg-secondary">
        <div className="flex justify-between items-start flex-wrap h-full w-full p-6">
          <div className="w-full lg:w-4/12 h-full flex justify-center lg:justify-start items-center">
            {data?.inscription_icon?.inscription_id ? (
              <div className="max-w-[300px] max-h-[300px] w-[250px] h-[250px] xl:w-[300px] xl:h-[300px]  relative rounded-2xl overflow-hidden">
                <CardContent
                  inscriptionId={data.inscription_icon.inscription_id}
                  content_type={data.inscription_icon.content_type}
                />
              </div>
            ) : (
              <div className="max-w-[300px] max-h-[300px] w-[250px] h-[250px] xl:w-[300px] xl:h-[300px]  relative rounded-2xl overflow-hidden">
                <img src={data.icon} />
              </div>
            )}
          </div>
          <div className=" w-full lg:w-8/12 p-6 flex flex-wrap justify-center relative h-full">
            <div className="detailPanel w-full md:w-8/12 md:pr-6">
              <h1 className="text-white text-xl md:text-3xl font-bold uppercase flex items-start">
                {data.name}
                {data.verified && (
                  <AiFillCheckCircle className="ml-2 text-yellow-500" />
                )}
              </h1>
              <p className="text-light_gray mt-2 text-sm">
                {" "}
                {data.description.length > 150
                  ? data.description.slice(0, 150) + "..."
                  : data.description}
              </p>
              <div className="flex mt-4 space-x-4">
                {data.twitter_link && (
                  <a
                    href={data.twitter_link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FaTwitter size={24} color="white" />
                  </a>
                )}
                {data.discord_link && (
                  <a
                    href={data.discord_link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FaDiscord size={24} color="white" />
                  </a>
                )}
                {data.website_link && (
                  <a
                    href={data.website_link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FaGlobe size={24} color="white" />
                  </a>
                )}
              </div>
              <div className="pt-3">
                <p className="text-sm font-bold text-white">Contacts:</p>
                <p className="text-xs">Email: {data.email}</p>
                <p className="text-xs">Discord ID: @{data.discord_id}</p>
              </div>
              <div className="my-6 flex items-center ">
                {!data.json_uploaded ? (
                  <>
                    <div>
                      <CustomButton
                        bgColor="bg-red-500"
                        loading={loading}
                        text={"Delete Collection Draft"}
                        onClick={handleSubmit}
                      />
                    </div>
                    <div className="pl-4">
                      <form onSubmit={handleJsonSubmit}>
                        <input
                          type="file"
                          name="file"
                          accept="application/json" // Allow only JSON files
                          ref={fileInputRef}
                          onChange={handleFileInputChange}
                          style={{ display: "none" }}
                          required
                        />
                        <button
                          disabled={loading || uploading}
                          onClick={triggerFileInput}
                          className="px-4 py-2 bg-accent hover:bg-accent_dark text-white"
                        >
                          {uploading
                            ? "Uploading..."
                            : "Upload Inscriptions JSON File"}
                        </button>
                      </form>
                    </div>
                  </>
                ) : (
                  <div>
                    <div className="bg-bitcoin text-yellow-900 px-4 py-2 ">
                      Under Review
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="sidePanel w-full md:w-4/12 md:border-l border-accent py-6 md:p-3">
              {data?.tags && data.tags.length > 0 && (
                <div className="tags flex items-center justify-start text-xs">
                  {data?.tags?.map((item, idx) => {
                    if (idx < 2 && !item.includes(";"))
                      return (
                        <span key={item} className="pr-3 py-3">
                          <span className="bg-accent border text-xs font-bold border-white px-4 py-2 rounded leading-1 text-white uppercase ">
                            {item}
                          </span>
                        </span>
                      );
                  })}
                </div>
              )}
              <div className="supply bg-primary-dark px-3 py-1 rounded-lg my-3 md:m-3 text-sm md:ml-0 w-full flex justify-between items-center">
                <span>Supply</span>
                <span className="text-white">{data.supply}</span>
              </div>
              {data?.max && (
                <div className="supply bg-primary-dark px-3 py-1 rounded-lg my-3 md:m-3 text-sm md:ml-0 w-full flex justify-between items-center">
                  <span>Max</span>
                  <span className="text-white">{data.max}</span>
                </div>
              )}
              {data?.min && (
                <div className="supply bg-primary-dark px-3 py-1 rounded-lg my-3 md:m-3 text-sm md:ml-0 w-full flex justify-between items-center">
                  <span>Min</span>
                  <span className="text-white">{data.min}</span>
                </div>
              )}
              {data?.holders && (
                <div className="supply bg-primary-dark px-3 py-1 rounded-lg my-3 md:m-3 text-sm md:ml-0 w-full flex justify-between items-center">
                  <span>Holders</span>
                  <span className="text-white">{data.holders_count}</span>
                </div>
              )}
              {(data?.listed || -10) > 0 && (
                <div className="supply bg-primary-dark px-3 py-1 rounded-lg my-3 md:m-3 text-sm md:ml-0 w-full flex justify-between items-center">
                  <span>Listed</span>
                  <span className="text-white">{data.listed}</span>
                </div>
              )}
              {data.fp !== undefined && !isNaN(data.fp) && data.fp > 0 && (
                <div className="supply bg-primary-dark px-3 py-1 rounded-lg my-3 md:m-3 text-sm md:ml-0 w-full flex justify-between items-center">
                  <span>FP</span>
                  <span className="text-white">
                    {data.fp / 100_000_000} BTC
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CollectionHero;
