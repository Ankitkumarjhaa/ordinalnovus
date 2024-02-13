"use server";

import { getCache, getCacheExpiry, setCache } from "@/lib/cache";
import axios from "axios";

export default async function fetchContentFromProviders(contentId: string) {
  const cacheKey = `on_content:${contentId}`;
  let content = await getCache(cacheKey);
  // console.log({ content });
  if (content) {
    // console.log("returning content from cache for ID: ", contentId);
    return content;
  }
  if (content === false) {
    console.log("returning null content from cache for ID: ", contentId);
    return null;
  }
  const PROVIDERS = [process.env.NEXT_PUBLIC_PROVIDER, "https://ordinals.com"];
  // if (process.env.NODE_ENV === "production") {
  //   if (process.env.NEXT_PUBLIC_URL?.includes("localhost"))
  //     PROVIDERS.unshift("http://192.168.1.33:8080");
  //   else PROVIDERS.unshift("http://ord-container:8080");
  // }
  let activeProvider = await getCache("activeProvider");

  if (!activeProvider) {
    activeProvider = PROVIDERS[0]; // Default to first provider if cache is empty
  }

  const providerIndex = PROVIDERS.indexOf(activeProvider);
  const startIndex = providerIndex >= 0 ? providerIndex : 0;

  for (let i = startIndex; i < PROVIDERS.length; i++) {
    try {
      const contentUrl = `${PROVIDERS[i]}/content/${contentId}`;
      // console.log(contentUrl);
      const response = await axios.get(contentUrl, {
        responseType: "arraybuffer",
      });

      // Cache the active provider if it's not the primary one and it's different from the cached one
      if (i !== 0 && PROVIDERS[i] !== activeProvider) {
        console.log("Setting cache activeProvider: ", PROVIDERS[i]);
        await setCache("activeProvider", PROVIDERS[i], 600); // 600 seconds = 10 minutes
      }

      if (response.status === 200) {
        const content = {
          data: response.data.toString("base64"),
          contentType: response.headers["content-type"],
        };

        console.log(`setting cache for: `, cacheKey);
        await setCache(cacheKey, content, 5 * 60 * 60);

        return content;
      }
      throw Error("API Call failed");
    } catch (error: any) {
      console.log(error.response.status, "error");
      if (error.response.status === 404) {
        // item has no content
        console.log("item has no content");
        await setCache("activeProvider", PROVIDERS[i], 600); // 600 seconds = 10 minutes
        await setCache(cacheKey, false, 5 * 60 * 60);
        return false;
      }
      console.warn(`Provider ${PROVIDERS[i]} failed. Trying next.`);

      // If the current provider is the last in the list, check if the primary provider is also failing
      if (i === PROVIDERS.length - 1 && activeProvider !== PROVIDERS[0]) {
        i = -1; // This will make the loop start from the primary provider in the next iteration
      }
    }
  }

  throw new Error("All providers failed");
}
