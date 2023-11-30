import { IInscription } from "@/types";
import React from "react";
import Content from "./Content";
import InscriptionDetail from "./InscriptionDetail";
type SearchDetailProps = {
  data: IInscription;
};
function SearchDetailPage({ data }: SearchDetailProps) {
  return (
    <div className="min-h-[40vh] py-16 flex justify-center flex-wrap">
      <Content data={data} />
      <InscriptionDetail data={data} />
    </div>
  );
}

export default SearchDetailPage;
