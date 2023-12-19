// app/api/v2/order/list-item.ts
import { NextRequest, NextResponse } from "next/server";
import { fetchLatestInscriptionData } from "@/utils/Marketplace";
import apiKeyMiddleware from "@/middlewares/apikeyMiddleware";
import { IInscription } from "@/types";
import {
  addFinalScriptWitness,
  verifySignature,
} from "@/utils/Marketplace/Listing";
import { Inscription } from "@/models";
import { setCache } from "@/lib/cache";
interface OrderInput {
  seller_receive_address: string;
  price: number; //in sats
  inscription_id: string;
  maker_fee_bp?: number;
  unsigned_listing_psbt_base64: string;
  tap_internal_key: string;
  listing: Listing;
  signed_listing_psbt_base64: string;
}

interface Listing {
  seller: Seller;
}

interface Seller {
  maker_fee_bp?: number;
  seller_ord_address: string;
  seller_receive_address: string;
  price: number;
  tap_internal_key: string;
  unsigned_listing_psbt_base64: string;
}

export async function POST(req: NextRequest) {
  console.log("***** LIST ITEM API CALLED *****");

  const middlewareResponse = await apiKeyMiddleware(
    ["inscription"],
    "read",
    []
  )(req);

  if (middlewareResponse) {
    return middlewareResponse;
  }
  const orderInput: OrderInput = await req.json();

  // Ensure orderInput contains all necessary fields
  const requiredFields = [
    "seller_receive_address",
    "price",
    "inscription_id",
    "unsigned_listing_psbt_base64",
    "tap_internal_key",
    "signed_listing_psbt_base64",
  ];
  const missingFields = requiredFields.filter(
    (field) => !Object.hasOwnProperty.call(orderInput, field)
  );

  if (missingFields.length > 0) {
    return NextResponse.json(
      {
        ok: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      },
      { status: 400 }
    );
  }

  try {
    // Fetch the ordItem data
    const ordItem: IInscription = await fetchLatestInscriptionData(
      orderInput.inscription_id
    );
    if (ordItem.address && ordItem.output && ordItem.output_value) {
      console.log("adding final script witness");

      const psbt = addFinalScriptWitness(orderInput.signed_listing_psbt_base64);
      if (ordItem.address.startsWith("bc1p")) {
        const validSig = verifySignature(psbt);
        if (!validSig) {
          return NextResponse.json(
            {
              ok: false,
              inscription_id: orderInput.inscription_id,
              price: orderInput.price,
              message: "Invalid signature",
            },
            { status: 500 }
          );
        }
      }

      const inscription = await Inscription.findOne({
        inscription_id: ordItem.inscription_id,
      });

      if (inscription) {
        valueChecks(inscription, ordItem);
        const metaprotocol = inscription.metaprotocol;
        let listed_price_per_token = 0;
        let listed_amount = 0;
        let listed_token = "";
        if (metaprotocol && metaprotocol.includes("cbrc-20:transfer")) {
          const [tag, mode, tokenAmt] = inscription.metaprotocol.split(":");
          const [token, amt] = tokenAmt.split("=");

          if (token) listed_token = token.trim().toLowerCase();
          if (!isNaN(Number(amt))) listed_amount = Number(amt);
          if (token && amt)
            listed_price_per_token = orderInput.price / Number(amt);
        }
        // If the document already exists, update it with the new fields
        inscription.listed = true;
        inscription.listed_at = new Date();
        inscription.listed_price = orderInput.price;
        inscription.listed_price_per_token = listed_price_per_token;
        inscription.listed_token = listed_token;
        inscription.listed_amount = listed_amount;
        inscription.listed_seller_receive_address =
          orderInput.seller_receive_address;
        inscription.signed_psbt = psbt;
        inscription.unsigned_psbt = orderInput.unsigned_listing_psbt_base64;
        inscription.listed_maker_fee_bp = orderInput.maker_fee_bp || 100;
        inscription.tap_internal_key = orderInput.tap_internal_key;
        await inscription.save();

        let docObject = inscription.toObject();
        delete docObject.__v; // remove version key
        delete docObject._id; // remove _id if you don't need it
        console.log("Updated listing");
      }

      // use orderInput object here
      return NextResponse.json({
        ok: true,
        inscription_id: orderInput.inscription_id,
        price: orderInput.price,
        message: "Success",
      });
    } else {
      throw Error("Ord Provider Unavailable");
    }
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      {
        ok: false,
        inscription_id: orderInput.inscription_id,
        price: orderInput.price,
        message: error.message,
      },
      { status: 500 }
    );
  }
}

const valueChecks = (inscription: IInscription, ordItem: IInscription) => {
  let valid = true;

  // Existing checks
  if (inscription.output !== ordItem.output) valid = false;
  if (inscription.output_value !== ordItem.output_value) valid = false;

  // Additional checks
  if (inscription.address !== ordItem.address) valid = false;
  if (inscription.offset !== ordItem.offset) valid = false;
  if (inscription.location !== ordItem.location) valid = false;

  if (!valid)
    throw Error("The inscription data is different on ord instance and DB");
};
