import { ISat, IInscription } from "@/types";
import React from "react";
import Content from "./Content";
import SatDetail from "./SatDetail";
type SearchDetailProps = {
  data: ISat;
};
function SearchDetailPage({ data }: SearchDetailProps) {
  return (
    <div className="min-h-[60vh] py-16 flex justify-center flex-wrap">
      <Content data={data} />
      <SatDetail data={data} />
    </div>
  );
}

export default SearchDetailPage;
