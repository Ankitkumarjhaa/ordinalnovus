import axios from "axios";
import type { NextApiRequest, NextApiResponse } from "next";
import apiKeyMiddleware from "../../../middlewares/apiKeyMiddleware";

import { getCache, setCache } from "@/lib/cache";

interface RecentInscription {
  href: string;
  title: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await apiKeyMiddleware(["ordapi"], "read")(req, res, async () => {
    try {
      console.log("***** ORDAPI FEED CALL *****");
      console.time("API call");
      // Try to get data from cache first
      const cachedData = await getCache("ordapi-feed");

      if (cachedData) {
        console.timeEnd("API call");
        console.log("Returning cached ordapi feed");
        // Send cached data as response
        res.status(200).json(cachedData);
      } else {
        console.log("Cache miss, fetching data from API");
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

        console.time("API calls");
        // Wait for all promises to resolve
        const formattedInscriptions = await Promise.all(inscriptionPromises);
        console.timeEnd("API calls");

        // Cache the response data in Redis for 10 minutes
        await setCache("ordapi-feed", formattedInscriptions, 600);

        res.status(200).json(formattedInscriptions);
      }
    } catch (error: any) {
      console.error("Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });
}
