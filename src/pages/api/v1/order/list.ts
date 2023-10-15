// pages/api/order/create.ts
import { NextApiRequest, NextApiResponse } from "next";
import { fetchLatestInscriptionData } from "@/utils/Marketplace";
import apiKeyMiddleware from "../../../../middlewares/apiKeyMiddleware";
import { IInscription } from "@/types/Ordinals";
import { addFinalScriptWitness, verifyAddress, verifyInputCount, verifyInscription, verifySignature } from "@/utils/Marketplace/Listing";
import {Inscription} from "@/models"
import { setCache } from "@/lib/cache";
interface OrderInput {
  sellerReceiveAddress: string;
  price: number; //in sats
  tokenId: string;
  makerFeeBp?: number;
  unsignedListingPSBTBase64: string;
  toSignInputs: number[];
  toSignSigHash: number;
  tapInternalKey: string;
  listing: Listing;
  signedListingPSBTBase64: string;
}

interface Listing {
  seller: Seller;
}

interface Seller {
  makerFeeBp?: number;
  sellerOrdAddress: string;
  sellerReceiveAddress: string;
  price: number;
  tapInternalKey: string;
  unsignedListingPSBTBase64: string;
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{
    ok: Boolean;
    tokenId?: string;
    price?: number;
    message: string;
  }>
) {
  await apiKeyMiddleware(["order"], "write")(req, res, async () => {
    console.log("***** ORDER CREATE API CALLED *****");

    // Ensure the request method is POST
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, message: "Method Not Allowed" });
    }

    const orderInput: OrderInput = req.body;

    // Ensure orderInput contains all necessary fields
    const requiredFields = [
      "sellerReceiveAddress",
      "price",
      "tokenId",
      "unsignedListingPSBTBase64",
      "toSignInputs",
      "toSignSigHash",
      "tapInternalKey",
      "listing",
      "signedListingPSBTBase64",
    ];
    const missingFields = requiredFields.filter(
      (field) => !Object.hasOwnProperty.call(orderInput, field)
    );

    if (missingFields.length > 0) {
      return res.status(400).json({
        ok: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    try {
      // Fetch the ordItem data
      const ordItem: IInscription = await fetchLatestInscriptionData(
        orderInput.tokenId
      );
      if (ordItem.address && ordItem.output && ordItem.output_value) {
        
        verifyInputCount(orderInput.signedListingPSBTBase64);
        verifyAddress(
          ordItem.address,
          orderInput.listing.seller.sellerOrdAddress
        );
        verifyInscription(
          orderInput.signedListingPSBTBase64,
          ordItem.output_value
        );
        const psbt = addFinalScriptWitness(orderInput.signedListingPSBTBase64);
        const validSig = verifySignature(psbt);
        if (!validSig) {
          return res.status(500).json({
            ok: false,
            tokenId: orderInput.tokenId,
            price: orderInput.price,
            message: "Invalid signature",
          });
        }

        // Check if a document with matching inscriptionId (tokenId) already exists
        const existingInscription = await Inscription.findOne({
          inscriptionId: orderInput.tokenId,
        });

        if (existingInscription) {
          // If the document already exists, update it with the new fields
          existingInscription.output = ordItem.output;
          existingInscription.output_value = ordItem.output_value;
          existingInscription.address = ordItem.address;
          existingInscription.listed = true;
          existingInscription.listedAt = new Date();
          existingInscription.listedPrice = orderInput.price;
          existingInscription.listedSellerReceiveAddress =
            orderInput.listing.seller.sellerReceiveAddress;
          existingInscription.signedPsbt = psbt;
          existingInscription.unSignedPsbt =
            orderInput.unsignedListingPSBTBase64;
          existingInscription.listedMakerFeeBp = orderInput.makerFeeBp || 100;
          existingInscription.tapInternalKey = orderInput.tapInternalKey;
          await existingInscription.save();

          let docObject = existingInscription.toObject();
          delete docObject.__v; // remove version key
          delete docObject._id; // remove _id if you don't need it
          await setCache(
            `inscription:${existingInscription.inscriptionId}`,
            docObject,
            6 * 60 * 60
          );

          console.log("Updated listing");
        } else {
          // If the document does not exist, create a new one
          const newInscription = new Inscription({
            inscriptionId: orderInput.tokenId, // Use the tokenId as the inscriptionId
            number: ordItem.number,
            output: ordItem.output,
            output_value: ordItem.output_value,
            address: ordItem.address,
            listed: true,
            listedAt: new Date(),
            listedPrice: orderInput.price,
            listedSellerReceiveAddress:
              orderInput.listing.seller.sellerReceiveAddress,
            signedPsbt: orderInput.signedListingPSBTBase64,
            unSignedPsbt: orderInput.unsignedListingPSBTBase64,
          });
          await newInscription.save();
        }

        // use orderInput object here
        res.status(200).json({
          ok: true,
          tokenId: orderInput.tokenId,
          price: orderInput.price,
          message: "Success",
        });
      } else {
        throw Error("Ord Provider Unavailable");
      }
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        ok: false,
        tokenId: orderInput.tokenId,
        price: orderInput.price,
        message: error.message,
      });
    }
  });
}

export default handler;
