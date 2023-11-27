import { IInscription } from "@/types";
import React from "react";
type InscriptionProps = {
  data: IInscription;
};
function DisplayAttributes({ data }: InscriptionProps) {
  return (
    <div className="">
      <p className="font-bold text-xl uppercase py-6">Attributes</p>
      {data?.attributes?.map((item: any, idx: number) => (
        <div
          key={idx}
          className="flex text-xs w-full justify-between items-center bg-secondary py-2 px-4 rounded-xl my-2"
        >
          <p>{item.trait_type}</p>
          <p className="text-sm text-white">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

export default DisplayAttributes;
