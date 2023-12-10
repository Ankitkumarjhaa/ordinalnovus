import SearchDetailPage from "@/Views/Inscription";
import searchInscription from "@/apiHelper/searchInscription";
import { IInscription } from "@/types";
import { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import React from "react";

async function Page({ params: { id } }: { params: { id: string } }) {
  const searchResult = await searchInscription({ id });
  return <SearchDetailPage data={searchResult.data.inscriptions[0]} />;
}

// or dynamic metadata
export async function generateMetadata(
  { params: { id } }: { params: { id: string } },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const searchResult = await searchInscription({ id });
  if (!searchResult) {
    notFound();
  }
  try {
    const inscription: IInscription = searchResult.data.inscriptions[0];
    return {
      title: `#${inscription.inscription_number} | Ordinal Novus`,
      description: `#${inscription.inscription_number} is an Inscription on BTC Blockchain with content_type ${inscription.content_type}`,
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
        title: `#${inscription.inscription_number} | Ordinal Novus`,
        description: `#${inscription.inscription_number} is an Inscription on BTC Blockchain with content_type ${inscription.content_type}`,
        url: `https://ordinalnovus.com/inscription/${inscription.inscription_id}`,
        siteName: "Ordinal Novus",
        images: `${
          process.env.NEXT_PUBLIC_URL
        }/api/generate-image?url=${encodeURIComponent(
          "https://ordinalnovus.com/inscription/" + inscription.inscription_id
        )}`,
        locale: "en-US",
      },
      twitter: {
        card: "summary_large_image",
        title: `#${inscription.inscription_number} | Ordinal Novus`,
        description: `#${inscription.inscription_number} is an Inscription on BTC Blockchain with content_type ${inscription.content_type}`,

        creator: "@OrdinalNovus",
        images: `${
          process.env.NEXT_PUBLIC_URL
        }/api/generate-image?url=${encodeURIComponent(
          "https://ordinalnovus.com/inscription/" + inscription.inscription_id
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
