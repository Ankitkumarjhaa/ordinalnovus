import CbrcDetailPage from "@/Views/CbrcPage/CbrcDetailPage";
import { FetchCBRC } from "@/apiHelper/getCBRC";
import { Icbrc } from "@/types/CBRC";
import { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
type Props = {
  params: { tick: string };
};

// or dynamic metadata
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  try {
    const cbrcs = await FetchCBRC({
      mode: "deploy",
      search: params.tick,
      offset: 0,
      sort: "creation:1",
    });

    if (!cbrcs) {
      notFound();
    }
    const cbrc: Icbrc = cbrcs.data.items[0];
    return {
      title: `${params.tick} | Ordinalnovus`,
      description: `${params.tick} is a CBRC-20 Token on BTC Blockchain with a supply of ${cbrc.max}`,
      keywords: ["cbrc", "cbrc-20", "ordinalnovus", "brc-20", "btc"],
      openGraph: {
        title: `${params.tick} | Ordinalnovus`,
        description: `${params.tick} is a CBRC-20 Token on BTC Blockchain with a supply of ${cbrc.max}`,
        url: `https://ordinalnovus.com/cbrc-20/${cbrc.tick}`,
        siteName: "Ordinalnovus",
        images: `${
          process.env.NEXT_PUBLIC_URL
        }/api/generate-image?url=${encodeURIComponent(
          "https://ordinalnovus.com/cbrc-20/" + cbrc.tick
        )}`,
        locale: "en-US",
      },
      twitter: {
        card: "summary_large_image",
        title: `${params.tick} | Ordinalnovus`,
        description: `${params.tick} is a CBRC-20 Token on BTC Blockchain with a supply of ${cbrc.max}`,
        creator: "@OrdinalNovus",
        images: `${
          process.env.NEXT_PUBLIC_URL
        }/api/generate-image?url=${encodeURIComponent(
          "https://ordinalnovus.com/cbrc-20/" + cbrc.tick
        )}`,
      },
    };
  } catch (e) {
    return {
      title: "Ordinalnovus",
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
        title: "Ordinalnovus",
        description:
          "Explore, trade, and showcase unique Bitcoin-based ordinals and inscriptions on OrdinalNovus, the ultimate platform for NFT enthusiasts, collectors, and creators.",
        url: "https://ordinalnovus.com",
        siteName: "Ordinalnovus",
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
        title: "Ordinalnovus",
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

export default async function Page({
  params,
  searchParams,
}: {
  params: { tick: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  console.log({ params });
  const cbrcs = await FetchCBRC({
    mode: "deploy",
    search: params.tick,
    offset: 0,
    sort: "creation:1",
  });

  console.log({ cbrcs });

  if (!cbrcs) {
    notFound();
  }
  const cbrc: Icbrc = cbrcs.data.items[0];
  if (!cbrc) {
    notFound();
  }
  return (
    <main>
      <CbrcDetailPage cbrc={cbrc} />
    </main>
  );
}
