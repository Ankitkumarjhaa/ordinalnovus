"use server";

import { getCache, getCacheExpiry, setCache } from "@/lib/cache";
import axios from "axios";

export default async function fetchContentFromProviders(contentId: string) {
  const PROVIDERS = [process.env.NEXT_PUBLIC_PROVIDER, "https://ordinals.com"];
  let activeProvider = await getCache("activeProvider");

  if (!activeProvider) {
    activeProvider = PROVIDERS[0]; // Default to first provider if cache is empty
  }

  const providerIndex = PROVIDERS.indexOf(activeProvider);
  const startIndex = providerIndex >= 0 ? providerIndex : 0;

  for (let i = startIndex; i < PROVIDERS.length; i++) {
    try {
      const response = await axios.get(`${PROVIDERS[i]}/content/${contentId}`, {
        responseType: "arraybuffer",
      });

      // Cache the active provider if it's not the primary one and it's different from the cached one
      if (i !== 0 && PROVIDERS[i] !== activeProvider) {
        console.log("Setting cache activeProvider: ", PROVIDERS[i]);
        await setCache("activeProvider", PROVIDERS[i], 600); // 600 seconds = 10 minutes
      }

      return response;
    } catch (error) {
      console.warn(`Provider ${PROVIDERS[i]} failed. Trying next.`);

      // If the current provider is the last in the list, check if the primary provider is also failing
      if (i === PROVIDERS.length - 1 && activeProvider !== PROVIDERS[0]) {
        i = -1; // This will make the loop start from the primary provider in the next iteration
      }
    }
  }

  throw new Error("All providers failed");
}
