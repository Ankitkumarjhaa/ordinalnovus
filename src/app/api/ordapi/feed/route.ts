import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

import apiKeyMiddleware from "@/middlewares/apikeyMiddleware";

import { getCache, setCache } from "@/lib/cache";

interface RecentInscription {
  href: string;
  title: string;
}

export async function GET(req: NextRequest) {
  const middlewareResponse = await apiKeyMiddleware(
    ["inscription"],
    "read",
    []
  )(req);

  if (middlewareResponse) {
    return middlewareResponse;
  }
  try {
    console.log("***** ORDAPI FEED CALL *****");

    // Try to get data from cache first
    const cachedData = await getCache("ordapi-feed");

    if (cachedData) {
      // Send cached data as response
      return NextResponse.json(cachedData);
    } else {
      const feedResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_PROVIDER}/api/feed`
      );

      // Check if API call was successful
      if (feedResponse.status !== 200) {
        throw new Error(
          `Failed to fetch feed with status code ${feedResponse.status}`
        );
      }
      const inscriptions = feedResponse.data._links.inscriptions.slice(0, 25); // Limit to first 25 items

      // Create an array of promises
      const inscriptionPromises = inscriptions.map(
        async (inscription: RecentInscription) => {
          const hrefParts = inscription.href.split("/");
          const inscriptionId = hrefParts[hrefParts.length - 1];

          const titleParts = inscription.title.split(" ");
          const number = parseInt(titleParts[titleParts.length - 1]);

          const contentResponse = await axios.get(
            `${process.env.NEXT_PUBLIC_PROVIDER}/content/${inscriptionId}`
          );

          return {
            inscriptionId,
            title: inscription.title,
            number,
            content_type: contentResponse.headers["content-type"],
            content: contentResponse.headers["content-type"].includes("text")
              ? contentResponse.data
              : null,
          };
        }
      );

      // Wait for all promises to resolve
      const formattedInscriptions = await Promise.all(inscriptionPromises);

      // Cache the response data in Redis for 10 minutes
      await setCache("ordapi-feed", formattedInscriptions, 600);

      if (formattedInscriptions)
        return NextResponse.json(formattedInscriptions);
      else return NextResponse.json({ formattedInscriptions: [] });
    }
  } catch (error: any) {
    console.error("Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
