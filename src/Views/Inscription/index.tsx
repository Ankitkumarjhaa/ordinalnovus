import { ISat, IInscription } from "@/types/Ordinals";
import React from "react";
import Content from "./Content";
import InscriptionDetail from "./InscriptionDetail";
type SearchDetailProps = {
  data: IInscription;
};
function SearchDetailPage({ data }: SearchDetailProps) {
  return (
    <div className="min-h-[60vh] py-16 flex justify-center flex-wrap">
      <Content data={data} />
      <InscriptionDetail data={data} />
    </div>
  );
}

export default SearchDetailPage;
