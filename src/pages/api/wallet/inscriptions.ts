import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { Inscription } from "@/models";
import dbConnect from "../../../lib/dbConnect";
import apiKeyMiddleware from "../../../middlewares/apiKeyMiddleware";
import { getCache, setCache } from "@/lib/cache";
import { fetchLatestInscriptionData } from "@/utils/Marketplace";
import { IInscription } from "@/types/Ordinals";

async function validateAndUpdateInscriptions(
  inscriptions: IInscription[],
  reqAddress: string
): Promise<IInscription[]> {
  for (let i = 0; i < inscriptions.length; i++) {
    if (inscriptions[i].address !== reqAddress) {
      const ordItem = await fetchLatestInscriptionData(
        inscriptions[i].inscriptionId+""
      );

      const updatedInscription = (await Inscription.findOneAndUpdate(
        { _id: inscriptions[i]._id },
        {
          address: reqAddress,
          listed: false,
          listedPrice: 0,
          signedPsbt: "",
          unSignedPsbt: "",
          output: ordItem.output,
          output_value: ordItem.output_value,
          offset: ordItem.offset,
          listedSellerReceiveAddress: "",
        },
        { new: true }
      ).exec()) as IInscription;

      inscriptions[i] = updatedInscription; // Update the local inscription object
    }
  }

  return inscriptions;
}

async function fetchUTXOs(address: string) {
  const response = await axios.get(
    `https://mempool.space/api/address/${address}/utxo`
  );
  return response.data;
}

function createOutputString(utxo: any) {
  const { txid, vout } = utxo;
  return `${txid}:${vout}`;
}

async function fetchInscriptionData(outputString: string) {
  const url = `${process.env.NEXT_PUBLIC_PROVIDER}/api/output/${outputString}`;
  const response = await axios.get(url);
  return response.data;
}

// Function to fetch content of an inscription
async function fetchInscriptionContent(inscriptionId: string) {
  const url = `${process.env.NEXT_PUBLIC_API}/content/${inscriptionId}`;
  const response = await axios.get(url);
  return response.data;
}

async function fetchInscriptionInfo(
  inscriptionIDs: string[],
  limit: number,
  skip: number
) {
  const inscriptions = await Inscription.find({
    inscriptionId: { $in: inscriptionIDs },
  })

    .populate({
      path: "officialCollection",
      select:
        "name inscription_icon supply slug description _id verified featured",
      populate: {
        path: "inscription_icon",
        select: "inscriptionId content_type",
      },
    })
    .limit(limit)
    .skip(skip)
    .exec();
  // Fetch content for each inscription that has "text" or "json" in the content_type
  for (const inscription of inscriptions) {
    if (
      inscription.content_type &&
      (inscription.content_type.includes("text") ||
        inscription.content_type.includes("json"))
    ) {
      const content = await fetchInscriptionContent(inscription.inscriptionId);
      inscription.content = content; // Add content to the inscription object
    }
  }

  return inscriptions;
}

async function fetchInscriptionIDs(
  address: string,
  limit: number,
  page: number
) {
  const skip = (page - 1) * limit;
  const inscriptionIDs: string[] = [];
  const utxos = await fetchUTXOs(address);

  for (let i = 0; i < utxos.length; i++) {
    if (inscriptionIDs.length >= skip + limit) {
      break;
    }

    const utxo = utxos[i];
    const outputString = createOutputString(utxo);
    const inscriptionData = await fetchInscriptionData(outputString);

    if (inscriptionData.inscriptions) {
      for (const inscription of inscriptionData.inscriptions) {
        const id = inscription;
        if (id) {
          inscriptionIDs.push(id);
        }

        if (inscriptionIDs.length >= skip + limit) {
          break;
        }
      }
    }
  }

  return {
    total: utxos.length,
    inscriptionIDs: inscriptionIDs.slice(skip, skip + limit),
  };
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await apiKeyMiddleware(["inscription"], "read")(req, res, async () => {
    console.log("***** WALLET INSCRIPTIONS API CALLED *****");
    await dbConnect();

    try {
      const { address, _page, _limit } = req.query;
      const page = parseInt(_page + "") || 1;
      const limit = parseInt(_limit + "") || 50;

      // Generate a unique cache key for this request
      const cacheKey = `walletInscriptions:${address}:${page}:${limit}`;

      // Try to fetch the result from cache
      let cachedResult = await getCache(cacheKey);

      // if (cachedResult) {
      //   // If the result exists in the cache, return it
      //   res.status(200).json(cachedResult);
      // } else
      {
        // If the result doesn't exist in the cache, query the database and APIs
        const { total, inscriptionIDs } = await fetchInscriptionIDs(
          address + "",
          limit,
          page
        );

        let inscriptions: any = await fetchInscriptionInfo(
          inscriptionIDs,
          limit,
          0 // We've already done the skipping in fetchInscriptionIDs, so we don't need to skip here
        );

        inscriptions = await validateAndUpdateInscriptions(
          inscriptions,
          address + ""
        );

        // Construct the result
        const result = {
          inscriptions,
          pagination: {
            page,
            limit,
            totalOutputs: total,
          },
        };

        // Cache the result for 10 minutes
        await setCache(cacheKey, result, 10 * 60);

        // Return the result
        res.status(200).json(result);
      }
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  });
}

export default handler;