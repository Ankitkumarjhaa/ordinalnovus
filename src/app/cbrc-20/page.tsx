import { Metadata, ResolvingMetadata } from "next";
import React from "react";

function Cbrc() {
  return <div></div>;
}

export async function generateMetadata(
  parent: ResolvingMetadata
): Promise<Metadata> {
  return {
    title: "CBRC-20 | Ordinal Novus",
    description:
      "Explore, trade, and showcase unique Bitcoin-based ordinals and inscriptions on OrdinalNovus, the ultimate platform for NFT enthusiasts, collectors, and creators.",
    keywords: [
      "OrdinalNovus",
      "NFT",
      "non-fungible tokens",
      "Bitcoin",
      "ordinals",
      "inscriptions",
      "marketplace",
      "explorer",
      "digital art",
      "blockchain",
      "NFT Trading",
      "NFT Collecting",
      "CBRC",
      "Cybord BRC",
    ],
    openGraph: {
      title: "CBRC-20 | Ordinal Novus",
      description:
        "Explore, trade, and showcase unique Bitcoin-based ordinals and inscriptions on OrdinalNovus, the ultimate platform for NFT enthusiasts, collectors, and creators.",
      url: "https://ordinalnovus.com/cbrc",
      siteName: "Ordinalnovus",
      images: [
        {
          url: `${
            process.env.NEXT_PUBLIC_URL
          }/api/generate-image?url=${encodeURIComponent(
            "https://ordinalnovus.com/cbrc"
          )}`,
        },
      ],
      locale: "en-US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "CBRC-20 | Ordinalnovus",
      description:
        "Explore, trade, and showcase unique Bitcoin-based ordinals and inscriptions on OrdinalNovus, the ultimate platform for NFT enthusiasts, collectors, and creators.",
      creator: "@OrdinalNovus",
      images: [
        `${
          process.env.NEXT_PUBLIC_URL
        }/api/generate-image?url=${encodeURIComponent(
          "https://ordinalnovus.com/cbrc"
        )}`,
      ],
    },
  };
}

export default Cbrc;
