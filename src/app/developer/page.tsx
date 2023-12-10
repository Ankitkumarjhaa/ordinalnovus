import APIDashboard from "@/Views/APIDashboard";
import { Metadata, ResolvingMetadata } from "next";
import React from "react";

async function Page() {
  return <APIDashboard />;
}
export async function generateMetadata(
  parent: ResolvingMetadata
): Promise<Metadata> {
  return {
    title: "Developer | Ordinal Novus",
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
      title: "Developer | Ordinal Novus",
      description:
        "Explore, trade, and showcase unique Bitcoin-based ordinals and inscriptions on OrdinalNovus, the ultimate platform for NFT enthusiasts, collectors, and creators.",
      url: "https://ordinalnovus.com",
      siteName: "Ordinal Novus",
      images: [
        {
          url: `${
            process.env.NEXT_PUBLIC_URL
          }/api/generate-image?url=${encodeURIComponent(
            "https://ordinalnovus.com/developer"
          )}`,
        },
      ],
      locale: "en-US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Developer | Ordinal Novus",
      description:
        "Explore, trade, and showcase unique Bitcoin-based ordinals and inscriptions on OrdinalNovus, the ultimate platform for NFT enthusiasts, collectors, and creators.",
      creator: "@OrdinalNovus",
      images: [
        `${
          process.env.NEXT_PUBLIC_URL
        }/api/generate-image?url=${encodeURIComponent(
          "https://ordinalnovus.com/developer"
        )}`,
      ],
    },
  };
}
export default Page;
