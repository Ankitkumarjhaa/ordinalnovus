"use client";
import React from "react";
import { ISat } from "@/types";
import CardContent from "@components/elements/CustomCardSmall/CardContent";
import { ImEnlarge } from "react-icons/im";
import { BsDownload } from "react-icons/bs";
import Modal from "@mui/material/Modal";
type ContentProps = {
  data: ISat;
};

function Content({ data }: ContentProps) {
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <div className="w-full lg:w-4/12 h-full flex flex-col justify-center lg:justify-start items-center">
      <div className="max-w-[300px] max-h-[300px] min-w-[300px] xl:min-w-[350px] min-h-[300px] xl:min-h-[350px] xl:h-[350px] p-6 rounded-xl lg:w-full bg-secondary border xl:border-2 border-accent lg:h-full relative overflow-hidden center">
        <p>{data?.name}</p>
      </div>
    </div>
  );
}

export default Content;
