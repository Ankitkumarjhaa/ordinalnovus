"use client";

import copy from "copy-to-clipboard";
import { useDispatch } from "react-redux";
import { addNotification } from "@/stores/reducers/notificationReducer";
import { IInscription, ISat } from "@/types";
import React, { useState } from "react";
import { BsFillShareFill } from "react-icons/bs";
import { TfiReload } from "react-icons/tfi";
import DisplayProperties from "./DisplayProperties";
import { useRouter } from "next/navigation";
import moment from "moment";
import CardContent from "@/components/elements/CustomCardSmall/CardContent";
import Link from "next/link";
type SatProps = {
  data: ISat;
};
function SatDetail({ data }: SatProps) {
  const router = useRouter();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  return (
    <div className="p-6 md:pt-0 pb-6 flex-1">
      <div className="pb-2 border-b xl:border-b-2 border-accent">
        <div className="relative">
          <h3 className="text-3xl font-extrabold text-white">
            {`SAT ${data?.name}`}
          </h3>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-gray-300 text-xs">
            {moment(data.timestamp).format("MMMM Do YYYY, h:mm:ss a")}
          </p>
          <div className="flex items-center justify-between">
            <div
              onClick={() => {
                copy(`${process.env.NEXT_PUBLIC_URL}/sat/${data?.name}`);
                dispatch(
                  addNotification({
                    id: new Date().valueOf(),
                    message: "Link Copied",
                    open: true,
                    severity: "success",
                  })
                );
              }}
              className="flex cursor-pointer items-center mr-4"
            >
              <BsFillShareFill className="text-accent mr-2" />
              Share
            </div>
            <div
              onClick={() => {
                router.refresh();
              }}
            >
              <TfiReload className="text-accent cursor-pointer" />
            </div>
          </div>
        </div>
      </div>
      <div className="relative hidden py-6 border-b-2 border-accent"></div>
      <div className="pt-2">
        <DisplayProperties data={data} />
      </div>
      <div>
        {data.inscriptions.length > 0 && (
          <div className="py-16">
            <h5 className="text-2xl pb-4 font-extrabold text-white">
              {`Inscriptions`}
            </h5>
            <div className="flex justify-start items-center pt-4">
              {data.inscriptions.map((item: IInscription) => (
                <div
                  key={item._id}
                  className="w-full md:w-3/12 flex flex-col justify-center lg:justify-start items-center"
                >
                  <Link shallow href={`/inscription/${item.inscription_id}`}>
                    <div className="min-w-[100px] min-h-[100px] p-6 rounded-xl  bg-secondary border xl:border-2 border-accent relative overflow-hidden center">
                      <CardContent
                        inscriptionId={item.inscription_id}
                        content_type={item.content_type}
                      />
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SatDetail;
