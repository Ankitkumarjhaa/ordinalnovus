import { fetchCollections } from "@/apiHelper/fetchCollection";
import CollectionDetailPage from "@/Views/CollectionDetailPage";
import { ICollection } from "@/types";
import { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
type Props = {
  params: { slug: string };
};

// or dynamic metadata
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const collection = await fetchCollections({ slug: params.slug, live: true });
  if (!collection) {
    notFound();
  }
  try {
    const coll: ICollection = collection.data.collections[0];
    return {
      title: `${coll.name} | Ordinal Novus`,
      description: coll.description,
      keywords: coll.name.split(" "),
      openGraph: {
        title: `${coll.name} | Ordinal Novus`,
        description: coll.description,
        url: `https://ordinalnovus.com/collection/${coll.slug}`,
        siteName: "Ordinal Novus",
        images: `${
          process.env.NEXT_PUBLIC_URL
        }/api/generate-image?url=${encodeURIComponent(
          "https://ordinalnovus.com/collection/" + coll.slug
        )}`,
        locale: "en-US",
      },
      twitter: {
        card: "summary_large_image",
        title: `${coll.name} | Ordinal Novus`,
        description: coll.description,
        creator: "@OrdinalNovus",
        images: `${
          process.env.NEXT_PUBLIC_URL
        }/api/generate-image?url=${encodeURIComponent(
          "https://ordinalnovus.com/collection/" + coll.slug
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

export default async function Page({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const data = await fetchCollections({ slug: params.slug, live: true });
  if (!data) {
    notFound();
  }
  return (
    <main>
      <CollectionDetailPage
        collections={data.data.collections}
        inscriptionCount={data.data.collections[0].updated || 0}
      />
    </main>
  );
}
