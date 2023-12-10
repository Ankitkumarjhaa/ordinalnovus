import SearchDetailPage from "@/Views/Sat";
import searchSat from "@/apiHelper/searchSat";
import { ISat } from "@/types";
import { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import React from "react";

async function Page({ params: { id } }: { params: { id: string } }) {
  const searchResult = await searchSat({ id });
  return <SearchDetailPage data={searchResult.data.sat} />;
}

// or dynamic metadata
export async function generateMetadata(
  { params: { id } }: { params: { id: string } },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const searchResult = await searchSat({ id });
  if (!searchResult) {
    notFound();
  }
  try {
    const sat: ISat = searchResult.data.sat;
    return {
      title: `SAT ${sat.name} | Ordinal Novus`,
      description: `${sat.name} is a SAT on BTC Blockchain. It's Number is ${sat.number} and Rarity is ${sat.rarity}`,
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
        title: `SAT ${sat.name} | Ordinal Novus`,
        description: `${sat.name} is a SAT on BTC Blockchain. It's Number is ${sat.number} and Rarity is ${sat.rarity}`,
        url: `https://ordinalnovus.com/sat/${sat.name}`,
        siteName: "Ordinal Novus",
        images: `${
          process.env.NEXT_PUBLIC_URL
        }/api/generate-image?url=${encodeURIComponent(
          "https://ordinalnovus.com/sat/" + sat.name
        )}`,
        locale: "en-US",
      },
      twitter: {
        card: "summary_large_image",
        title: `SAT ${sat.name} | Ordinal Novus`,
        description: `${sat.name} is a SAT on BTC Blockchain. It's Number is ${sat.number} and Rarity is ${sat.rarity}`,

        creator: "@OrdinalNovus",
        images: `${
          process.env.NEXT_PUBLIC_URL
        }/api/generate-image?url=${encodeURIComponent(
          "https://ordinalnovus.com/sat/" + sat.name
        )}`,
      },
    };
  } catch (e) {
    return {
      title: "Ordinal Novus",
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
        title: "Ordinal Novus",
        description:
          "Explore, trade, and showcase unique Bitcoin-based ordinals and inscriptions on OrdinalNovus, the ultimate platform for NFT enthusiasts, collectors, and creators.",
        url: "https://ordinalnovus.com",
        siteName: "Ordinal Novus",
        images: [
          {
            url: `${
              process.env.NEXT_PUBLIC_URL
            }/api/generate-image?url=${encodeURIComponent(
              "https://ordinalnovus.com"
            )}`,
          },
        ],
        locale: "en-US",
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: "Ordinal Novus",
        description:
          "Explore, trade, and showcase unique Bitcoin-based ordinals and inscriptions on OrdinalNovus, the ultimate platform for NFT enthusiasts, collectors, and creators.",
        creator: "@OrdinalNovus",
        images: [
          `${
            process.env.NEXT_PUBLIC_URL
          }/api/generate-image?url=${encodeURIComponent(
            "https://ordinalnovus.com"
          )}`,
        ],
      },
    };
  }
}
export default Page;
