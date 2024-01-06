"use server";
import { webhooks } from "@/lib/cbrc-20-sales-webhook";
import { getBTCPriceInDollars, shortenString } from "..";
import { getCache, invalidateCache, setCache } from "@/lib/cache";

const sendWebhook = async (transactions: any[]) => {
  for (const transaction of transactions) {
    for (const webhookUrl of webhooks) {
      try {
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(transaction),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        console.log(
          `Webhook sent to ${webhookUrl} for transaction ${
            transaction.id || ""
          }`
        );
      } catch (error) {
        console.error(`Error sending webhook to ${webhookUrl}:`, error);
      }
    }
  }
};

const discordWebhookCBRCSaleAlert = async (txBulkOps: any[]) => {
  // Send cached webhooks at the start
  const cachedWebhookKeys = await getCache("webhookCacheKeys");
  if (cachedWebhookKeys) {
    for (const key of cachedWebhookKeys) {
      const cachedWebhook = await getCache(`webhookCache:${key}`);
      if (cachedWebhook) {
        // Remove the txid field from the cached webhook object
        delete cachedWebhook.txid;
        await sendWebhook([cachedWebhook]); // Send the cached webhook body
      }
    }
    await invalidateCache("webhookCacheKeys"); // Clear the cache keys after sending
  }
  // Create a Set to track unique txids
  const uniqueTxids = new Set();
  let newCacheKeys = [];

  // Filter out transactions with duplicate txids
  const uniqueTransactions = txBulkOps.filter((tx) => {
    const txid = tx.updateOne?.filter?._id; // Adjust this line if the txid is located elsewhere in your data structure
    if (txid && !uniqueTxids.has(txid)) {
      uniqueTxids.add(txid);
      return true;
    }
    return false;
  });

  console.log("Processing transactions");
  let btcPrice = 0;

  const cacheKey = "bitcoinPrice";
  const cache = await getCache(cacheKey);
  if (cache) btcPrice = cache;
  else {
    btcPrice = await getBTCPriceInDollars();
    await setCache(cacheKey, btcPrice, 60);
  }
  console.log({ btcPrice });

  for (const tx of uniqueTransactions) {
    const { updateOne } = tx;
    if (updateOne) {
      const { filter, update } = updateOne;
      const { _id } = filter;
      const { $set } = update;

      // Destructure or access the required properties from $set
      const txid = $set.txid || "";
      const inscriptions = $set.inscriptions || [];
      const tag = $set.tag || "others";
      const parsed = $set.parsed || false;
      const from = $set.from || "";
      const to = $set.to || "";
      const price = $set.price || 0;
      const marketplace = $set.marketplace || "";
      const parsed_metaprotocol = $set.parsed_metaprotocol || null;

      // Example: Process or log these variables as needed
      if (
        txid &&
        from &&
        to &&
        price &&
        parsed_metaprotocol &&
        parsed_metaprotocol?.includes("cbrc-20:transfer")
      ) {
        const [protocol, op, tokenAmt] = parsed_metaprotocol.split(":");
        if (!tokenAmt || !tokenAmt.includes("=")) return;

        const [token, amt] = tokenAmt.split("=");

        if (token && amt) {
          const body = {
            txid,
            content: null,
            embeds: [
              {
                title: `${amt} ${token} Sold!`,
                description: `ID:  ${inscriptions[0]}\n\n`,
                url: `https://mempool.space/tx/${txid}`,
                color: 9503472,
                fields: [
                  {
                    name: "Ticker",
                    value: token,
                    inline: false,
                  },
                  {
                    name: "Price",
                    value: `${price} sats ($${(
                      (price / 100_000_000) *
                      btcPrice
                    ).toFixed(2)}) ${marketplace ? `on ` + marketplace : ""}`,
                    inline: false,
                  },
                  {
                    name: "Amount",
                    value: amt,
                    inline: false,
                  },
                  {
                    name: "Unit Price",
                    value: `${(price / amt).toFixed(2)} sats ($${(
                      (price / amt / 100_000_000) *
                      btcPrice
                    ).toFixed(2)}) }`,
                    inline: false,
                  },
                  {
                    name: "Buyer",
                    value: shortenString(to),
                    inline: true,
                  },
                  {
                    name: "Seller",
                    value: shortenString(from),
                    inline: true,
                  },
                ],
                author: {
                  name: "Ordinalnovus",
                  url: "https://ordinalnovus.com",
                  icon_url:
                    "https://cdn.discordapp.com/icons/1084821571593584721/6255b154ba89556bc5429986f6f66999.webp",
                },
              },
            ],
            attachments: [],
          };
          if (body) {
            // Check if this transaction's webhook has already been cached
            const existingCache = await getCache(`webhookCache:${txid}`);
            if (!existingCache) {
              // Cache the webhook body for 1 hour
              await setCache(`webhookCache:${txid}`, body, 3600);
              newCacheKeys.push(txid);
            }
          }
        }

        console.log({ parsed_metaprotocol });
        console.log(
          `Transaction ID: ${txid}, From: ${from}, To: ${to}, Price: ${price}`
        );
      }

      // Further processing can be done here
    }
  }

  // Update the list of cached webhook keys
  if (newCacheKeys.length > 0) {
    const existingKeys = (await getCache("webhookCacheKeys")) || [];
    const updatedKeys = [...existingKeys, ...newCacheKeys];
    await setCache("webhookCacheKeys", updatedKeys, 3600); // Cache the updated keys list
  }

  // Additional code for the rest of the function
};

export default discordWebhookCBRCSaleAlert;
