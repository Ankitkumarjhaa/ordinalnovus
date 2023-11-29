"use server";

import { getCache, setCache } from "@/lib/cache";
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
      console.log("GOT Response from: ", PROVIDERS[i]);
      if (i !== 0) {
        // Cache the active provider for 10 minutes if it's not the primary one
        await setCache("activeProvider", PROVIDERS[i], 600); // 600 seconds = 10 minutes
      }
      return response;
    } catch (error) {
      console.warn(`Provider ${PROVIDERS[i]} failed. Trying next.`);
      if (i === PROVIDERS.length - 1) {
        // Rotate back to the first provider if at the end of the list
        await setCache("activeProvider", PROVIDERS[0], 600);
      }
    }
  }

  throw new Error("All providers failed");
}
