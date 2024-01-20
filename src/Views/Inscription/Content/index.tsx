"use client";
import React from "react";
import { IInscription } from "@/types";
import CardContent from "@components/elements/CustomCardSmall/CardContent";
import { ImEnlarge } from "react-icons/im";
import { FaExternalLinkAlt } from "react-icons/fa";
import { BsDownload, BsChevronLeft, BsChevronRight } from "react-icons/bs";
import Modal from "@mui/material/Modal";
import Link from "next/link";
import { downloadInscription } from "@/utils";
type ContentProps = {
  data: IInscription;
};

function Content({ data }: ContentProps) {
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <div className="w-full lg:w-4/12 h-full flex relative flex-col justify-center lg:justify-start items-center">
      <div className="max-w-[300px] max-h-[300px] min-w-[300px] xl:min-w-[350px] min-h-[300px] xl:min-h-[350px] xl:h-[350px] rounded-xl lg:w-full bg-secondary border xl:border-2 border-accent lg:h-full relative overflow-hidden center">
        <CardContent
          inscriptionId={data.inscription_id}
          content_type={data.content_type}
          inscription={data}
          className={`${
            data.content_type?.includes("html") ? "w-[360px] h-[360px]" : ""
          }`}
        />
      </div>
      {
        <div className="w-full mt-2 py-4 px-2 border-2 center border-accent rounded-2xl ">
          <Link shallow href={`/inscription/${data.previous}`}>
            <div className="mx-4 cursor-pointer">
              <BsChevronLeft className="hover:text-white" />
            </div>
          </Link>
          <div onClick={handleOpen} className="mx-4 cursor-pointer">
            <ImEnlarge className="hover:text-white" />
          </div>
          <div className="mx-4 cursor-pointer">
            <BsDownload
              onClick={() => downloadInscription(data.inscription_id)}
              className="hover:text-white"
            />
          </div>
          <Link target="_blank " href={`/content/${data.inscription_id}`}>
            <div className="mx-4 cursor-pointer">
              <FaExternalLinkAlt className="hover:text-white" />
            </div>
          </Link>
          <Link shallow href={`/inscription/${data.next}`}>
            <div className="mx-4 cursor-pointer">
              <BsChevronRight className="hover:text-white" />
            </div>
          </Link>
          <Modal open={open} onClose={handleClose}>
            <div
              className="absolute top-0 bottom-0 right-0 left-0 bg-black bg-opacity-90"
              onClick={() => handleClose()}
            >
              <div className="relative center w-full h-screen">
                {/* TODO: Handle images and texts and videos on large */}
                <div className={`card_div p-2 h-[70vh]`}>
                  <div className="relative rounded-xl border xl:border-2 border-accent overflow-hidden bg-secondary shadow-xl p-3 h-[50vh]">
                    <div className="content-div h-full overflow-hidden">
                      <CardContent
                        showFull={true}
                        inscriptionId={data?.inscription_id}
                        content_type={data?.content_type}
                        inscription={data}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Modal>
        </div>
      }
    </div>
  );
}

export default Content;
