import ListCollection from "@/Views/Dashboard/AddCollectionPage";
import { Metadata, ResolvingMetadata } from "next";
import React from "react";

function Creator() {
  return <ListCollection />;
}
export async function generateMetadata(
  parent: ResolvingMetadata
): Promise<Metadata> {
  return {
    title: "Add Collection | Ordinal Novus",
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
    ],
    openGraph: {
      title: "Add Collection | Ordinal Novus",
      description:
        "Explore, trade, and showcase unique Bitcoin-based ordinals and inscriptions on OrdinalNovus, the ultimate platform for NFT enthusiasts, collectors, and creators.",
      url: "https://ordinalnovus.com/add-collection",
      siteName: "Ordinal Novus",
      images: [
        {
          url: `${
            process.env.NEXT_PUBLIC_URL
          }/api/generate-image?url=${encodeURIComponent(
            "https://ordinalnovus.com/add-collection"
          )}`,
        },
      ],
      locale: "en-US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Add Collection | Ordinal Novus",
      description:
        "Explore, trade, and showcase unique Bitcoin-based ordinals and inscriptions on OrdinalNovus, the ultimate platform for NFT enthusiasts, collectors, and creators.",
      creator: "@OrdinalNovus",
      images: [
        `${
          process.env.NEXT_PUBLIC_URL
        }/api/generate-image?url=${encodeURIComponent(
          "https://ordinalnovus.com/add-collection"
        )}`,
      ],
    },
  };
}
export default Creator;
