"use client";
import { IInscription } from "@/types";
import { shortenString } from "@/utils";
import copy from "copy-to-clipboard";
import React from "react";
import { useDispatch } from "react-redux";
import { addNotification } from "@/stores/reducers/notificationReducer";
import { Tooltip } from "@mui/material";
type InscriptionProps = {
  data: IInscription;
};
function DisplayProperties({ data }: InscriptionProps) {
  const dispatch = useDispatch();

  const properties: any = [
    {
      label: "ID",
      value: data?.inscription_id || "none",
      shortenValue: data?.inscription_id
        ? shortenString(data?.inscription_id || "none")
        : null,
    },
    {
      label: "Address",
      value: data?.address || "none",
      shortenValue: data?.address
        ? shortenString(data?.address || "none")
        : null,
    },
    {
      label: "Number",
      value: data?.inscription_number || 0,
      shortenValue: data?.inscription_number
        ? shortenString(data?.inscription_number?.toString() || "")
        : null,
    },
    {
      label: "UTXO",
      value: data?.output || "none",
      shortenValue: data?.output ? shortenString(data?.output || "none") : null,
    },
    {
      label: "Content Type",
      value: data?.content_type || "none",
      shortenValue: data?.content_type?.split(";")[0]
        ? shortenString(data?.content_type?.split(";")[0] || "none")
        : null,
    },
    {
      label: "Block",
      value: data?.genesis_height || "none",
    },
    { label: "Offset", value: data?.offset || 0 },
    {
      label: "Sat Offset",
      value: data?.sat_offset || 0,
    },
    {
      label: "sha",
      value: data?.sha ? data?.sha : null,
      shortenValue: data?.sha ? shortenString(data?.sha || "none") : null,
    },
    { label: "Output Value", value: data?.output_value || 0 },
    {
      label: "Sat",
      value: data?.sat || null,
      shortenValue: data?.sat
        ? shortenString(String(data?.sat) || "none")
        : null,
    },
    { label: "Rarity", value: data?.rarity || null },
    {
      label: "Collection",
      value: data?.official_collection?.name || null,
      shortenValue: data?.official_collection?.name
        ? shortenString(String(data?.official_collection?.name) || "none")
        : null,
    },
    {
      label: "Metaprotocol",
      value: data?.metaprotocol || null,
      shortenValue: data?.metaprotocol
        ? shortenString(String(data?.metaprotocol) || "none")
        : null,
    },
    {
      label: "CBRC Valid",
      value:
        data?.parsed_metaprotocol &&
        data?.parsed_metaprotocol.includes("cbrc-20")
          ? data?.cbrc_valid
          : null,
    },
  ];
  return (
    <div className="flex items-center justify-start flex-wrap">
      {properties.map(
        (
          property: {
            value: string | number | boolean | null | undefined;
            label: string | number | boolean | null | undefined;
            shortenValue: string | number | boolean | null | undefined;
          },
          index: React.Key | null | undefined
        ) => {
          if (
            (property.value || property.value === 0) &&
            property.label !== "CBRC Valid"
          )
            return (
              <div key={index} className="p-3 w-6/12 md:w-4/12">
                <Tooltip title={property.value}>
                  <div
                    onClick={() => {
                      copy(String(property?.value));
                      dispatch(
                        addNotification({
                          id: new Date().valueOf(),
                          message: property.label + " Copied",
                          open: true,
                          severity: "success",
                        })
                      );
                    }}
                    className="bg-secondary hover:bg-primary-dark cursor-pointer flex items-center p-3 rounded-xl"
                  >
                    <div className="flex-1">
                      <p className="text-light_gray capitalize text-xs">
                        {property.label}
                      </p>
                      <p className="text-xs md:text-lg text-white">
                        {property?.shortenValue
                          ? property.shortenValue
                          : property.value}
                      </p>
                    </div>
                  </div>
                </Tooltip>
              </div>
            );
        }
      )}
    </div>
  );
}

export default DisplayProperties;
