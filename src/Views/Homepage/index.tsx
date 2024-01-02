"use client";
import { RecentInscription } from "@/types";
import { Order } from "@/types/Ordinals/Orders";
import React from "react";
import Hero from "./Hero";
import Recent from "./RecentlyInscribed";
import Collections from "./Collections";
import { ICollection, IInscription } from "@/types";
import CBRC from "./CBRC";
import CBRCListings from "../CBRCHomepage/CBRCListings";
import CBRCSales from "../CbrcPage/CbrcDetailPage/CBRCSales";
type Data = {
  height: number;
  percentParsed: number;
  featured: ICollection[];
  verified: ICollection[];
  orders: Order[];
  listings: IInscription[];
  recentInscriptions: RecentInscription[]; // Define the shape of the data object here
};

type HomepageProps = {
  data: Data;
};

function Homepage({ data }: HomepageProps) {
  const list = [
    {
      id: "17ce7490a6ba7845608b7184d3a6b5b3e33b3ea8c89ededecfc008aef30b4a0di0",
      type: "image/jpeg",
    },
    {
      id: "7acd66e6f673e82999cedd37de5a4cbe41f217ae6f1dbf26a1ddfd6ef5488051i0",
      type: "image/png",
    },
    {
      id: "c17dd02a7f216f4b438ab1a303f518abfc4d4d01dcff8f023cf87c4403cb54cai0",
      type: "image/gif",
    },
    {
      id: "16f3c32468e3e52ac20dc8fc633c686f0e31c5f34407413d12ad764ba5ad5f3bi0",
      type: "image/webp",
    },
    {
      id: "b21ee1e6b643444c0c88943e175a007d689590e604991cf72c7f29cb472a304di0",
      type: "image/avif",
    },
    {
      id: "765cf24db22df4d7bae1cd12e5ee4780dc263486e426d8d1758eaa0515fa6fcei0",
      type: "image/svg+xml",
    },
    {
      id: "ad99172fce60028406f62725b91b5c508edd95bf21310de5afeb0966ddd89be3i0",
      type: "audio/mpeg",
    },
    {
      id: "51711bdc00b7359c1f45b9f14bf34d0b2bf0e8173c734135b58045dad2442148i0",
      type: "audio/midi",
    },
    {
      id: "a84e1bf6e5184cafe55c831613c0c992ab058079350966b46fe76b5e25394a8ei0",
      type: "audio/mod",
    },
    {
      id: "fdcf0b5725301493f3bbb0564d9a1ecac9ab5baa0d3c6523ca77186184f3c3fai0",
      type: "video/webm",
    },
    {
      id: "f58ad8178e7fe78624bcd814cf4b655dab8a6d5f293d4a395a8f24c49aaba78ai0",
      type: "text/plain;charset=utf-8",
    },
    {
      id: "5a847eae3a131950bc486d977504e13803fa9d6f905ec9f22083c0660f9ad035i0",
      type: "application/json",
    },
    {
      id: "379b18942989c8458fe92fc89e5f32d62c9f8be520779e293908df2b58bcd2dai0",
      type: "application/javascript",
    },
    {
      id: "7cb9e68be2da31016b2aa544924f6348a452368259f16fb6acf4a4060c77325di0",
      type: "text/markdown",
    },
    {
      id: "b1af4d44feb0053adc0c075ca089612c1f7ce8ae1447e80860258aa7a57c14d3i0",
      type: "application/pdf",
    },
    {
      id: "491a5875232f130697b70cd7d2820da29d3fd41666fbd63635638b88c7efc39ei0",
      type: "model/stl",
    },
    {
      id: "503cafd70b95d868982b4511e903dc305348fcf71baf068895664c1c6291ede0i0",
      type: "model/gltf-binary",
    },
    {
      id: "8a1b1f1001e7c0d80c8072e5df1c17325a5d4334f91ddc67dd000a0fee76e30fi0",
      type: "model/gltf-binary",
    },
    {
      id: "2ab9c03109114de3b27a277392a082f39df718937170fa52a6a68c0a5ef7c078i0",
      type: "model/gltf-binary",
    },
    {
      id: "058eef4079d9ceaf4c3f36a657a5c2fa73f8d7ed919bb567068acf308f178092i0",
      type: "application/zip",
    },
    {
      id: "e3458e92bc7a8c2653434f8618f6d56b9025c5adc23c48c33263267bc3ad509fi0",
      type: "application/x-zip-compressed",
    },
    {
      id: "a348c257a0dcb173ad044c7309b8057c44e49d80112fc0f9975cb103cd212d6ei0",
      type: "text/html;charset=utf-8",
    },
  ];
  return (
    <div className="pt-16">
      {data.percentParsed < 98 && (
        <div className="bg-yellow-700 w-full my-2 text-center text-xs uppercase font-bold text-white flex justify-start">
          <span
            style={{ width: `${data.percentParsed}%` }}
            className={`bg-green-300 py-1 text-green-900`}
          >
            indexing... {data.percentParsed}%
          </span>
        </div>
      )}
      {data?.height && (
        <div className="bg-yellow-700 py-2 w-full my-2 text-center text-xs uppercase font-bold text-white">
          <p className="text-center">Height: {data.height}</p>
        </div>
      )}
      {/* <div className="center p-2 flex-wrap">
        {list.map((item) => (
          <div
            key={item.id}
            className="h-[300px] w-[300px] relative rounded-xl overflow-hidden"
          >
            <div className="m-2 p-2 bg-green-200">
              <CardContent inscriptionId={item.id} content_type={item.type} />
              <p className="absolute bg-primary p-1 text-bitcoin z-50">
                {item.type}
              </p>
            </div>
          </div>
        ))}
      </div> */}
      <Hero data={data.featured} />
      <CBRC />
      <CBRCListings />
      {/* <CBRCSales /> */}
      <Collections data={data.verified} />
      {/* {data.listings.length ? <Listed data={data.listings} /> : <></>} */}
      {data.recentInscriptions && data?.recentInscriptions.length ? (
        <Recent data={data.recentInscriptions} />
      ) : (
        <></>
      )}
    </div>
  );
}

export default Homepage;
