import { IInscription } from "@/types";
import React from "react";
type InscriptionProps = {
  data: IInscription;
};
function DisplayMetadata({ data }: InscriptionProps) {
  return (
    <div className="">
      {!data?.metadata["attributes"] ? (
        <>
          <p className="font-bold text-xl uppercase py-6">Metadata</p>
          {Object.entries(data?.metadata || {}).map(([key, value], idx) => (
            <div
              key={idx}
              className="flex text-xs w-full justify-between items-center bg-secondary py-2 px-4 rounded-xl my-2"
            >
              <p className="uppercase">{key}</p>
              {
                //@ts-ignore
                <p className="text-sm text-white">{value}</p>
              }
            </div>
          ))}
        </>
      ) : (
        <>
          {!data.attributes && (
            <>
              {" "}
              <p className="font-bold text-xl uppercase py-6">
                Attributes (CBOR)
              </p>
              {data?.metadata?.attributes?.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="flex text-xs w-full justify-between items-center bg-secondary py-2 px-4 rounded-xl my-2"
                >
                  <p className="uppercase">{item.trait_type}</p>
                  <p className="text-sm text-white">{item.value}</p>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default DisplayMetadata;
