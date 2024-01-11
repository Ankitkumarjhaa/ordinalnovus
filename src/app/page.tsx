import CBRCHomepage from "@/Views/CBRCHomepage";
import getHomepage from "@/apiHelper/fetchHomepage";
import fetchStats from "@/apiHelper/fetchStats";
import { FetchCBRC } from "@/apiHelper/getCBRC";
import { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
export default async function Home() {
  const data = await FetchCBRC({
    page_size: 20,
    page: 1,
  });

  const statsData = await fetchStats()

  const CollectionData = await getHomepage();
  if (!data?.data || !statsData) {
    notFound();
  }

  return (
    <div className="">
      <CBRCHomepage featured = {CollectionData.data.featured} tokens={data.data.tokens} stats={statsData}/>
    </div>
  );
}

export async function generateMetadata(
  parent: ResolvingMetadata
): Promise<Metadata> {
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
