"use client";
import { IInscription } from "@/types";
import React from "react";
import Content from "./Content";
import InscriptionDetail from "./InscriptionDetail";
import CardContent from "@/components/elements/CustomCardSmall/CardContent";
import Link from "next/link";
type SearchDetailProps = {
  data: IInscription;
};
function SearchDetailPage({ data }: SearchDetailProps) {
  return (
    <>
      {" "}
      <div className="w-full my-2 text-xs py-2 uppercase font-bold text-white text-center">
        <p
          className={`text-red-400 bg-red-100  py-2 w-full border-accent border rounded tracking-widest font-bold`}
        >
          Users are responsible for their transactions.
        </p>
      </div>
      <div className="min-h-[40vh] py-16 flex justify-center flex-wrap">
        <Content data={data} />
        <InscriptionDetail data={data} />
      </div>
      <>
        {data?.reinscriptions && data?.reinscriptions.length > 0 ? (
          <div className="w-full">
            <h4 className="text-lg pb-6 text-center">
              Reinscriptions On This SAT
            </h4>
            <div className="flex justify-normal items-end overflow-auto flex-wrap">
              {data.reinscriptions.map((i) => (
                <div
                  key={i.inscription_id}
                  className={`relative p-6 md:w-6/12 lg:w-3/12   w-full cursor-pointer `}
                >
                  <div
                    className={`border xl:border-2 border-accent  rounded-xl shadow-xl p-3 $ bg-secondary`}
                  >
                    <Link href={`/inscription/${i.inscription_id}`}>
                      <div className="content-div h-[60%] rounded overflow-hidden relative cursor-pointer">
                        <CardContent
                          inscriptionId={i.inscription_id}
                          content_type={i.content_type}
                          inscription={i}
                        />
                      </div>
                    </Link>
                    <div className={`h-[40%] flex flex-col justify-end `}>
                      <div className="py-2 mb-2 center">
                        <div className="flex-1">
                          <h5 className=" text-sm font-bold tracking-tight text-white">
                            #{i.inscription_number}
                          </h5>
                          {i &&
                            i?.collection_item_name &&
                            i?.official_collection && (
                              <Link
                                href={`/collection/${i?.official_collection?.slug}`}
                              >
                                <span className="bg-yellow-500 mb-2 rounded-md text-center text-xs py-1 px-3 font-bold text-yellow-900">
                                  {i.collection_item_name}
                                </span>
                              </Link>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <></>
        )}
      </>
    </>
  );
}

export default SearchDetailPage;
