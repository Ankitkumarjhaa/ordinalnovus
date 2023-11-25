"use client";
import { ISat } from "@/types";
import copy from "copy-to-clipboard";
import React from "react";
import { useDispatch } from "react-redux";
import { addNotification } from "@/stores/reducers/notificationReducer";
import { Tooltip } from "@mui/material";
type SatProps = {
  data: ISat;
};
function DisplayProperties({ data }: SatProps) {
  const dispatch = useDispatch();

  const properties: any = [
    {
      label: "Block",
      value: data?.block || "none",
    },
    {
      label: "Sat Offset",
      value: data?.offset || 0,
    },
    {
      label: "Sat Cycle",
      value: data?.cycle || 0,
    },
    {
      label: "Sat Epoch",
      value: data?.epoch || 0,
    },
    { label: "Rarity", value: data?.rarity || null },
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
          if (property.value || property.value === 0)
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
