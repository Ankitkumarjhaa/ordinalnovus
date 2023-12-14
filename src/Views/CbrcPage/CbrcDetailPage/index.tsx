import { Icbrc } from "@/types/CBRC";
import React from "react";
import Hero from "./CbrcHero";

type CbrcDetailPageProps = {
  cbrc: Icbrc;
};

function CbrcDetailPage({ cbrc }: CbrcDetailPageProps) {
  return (
    <div>
      <Hero data={cbrc} />
    </div>
  );
}

export default CbrcDetailPage;
