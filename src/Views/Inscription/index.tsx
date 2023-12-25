import { IInscription } from "@/types";
import React from "react";
import Content from "./Content";
import InscriptionDetail from "./InscriptionDetail";
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
    </>
  );
}

export default SearchDetailPage;
