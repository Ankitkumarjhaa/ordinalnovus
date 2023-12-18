// app/api/v2/order/delete-listing.ts
import { NextRequest, NextResponse } from "next/server";
import { fetchLatestInscriptionData } from "@/utils/Marketplace";
import apiKeyMiddleware from "@/middlewares/apikeyMiddleware";
import { IInscription } from "@/types";
import {
  addFinalScriptWitness,
  verifySignature,
} from "@/utils/Marketplace/Listing";
import { Inscription } from "@/models";
interface OrderInput {
  seller_receive_address: string;
  tap_internal_key: string;
  inscription_id: string;
}

export async function POST(req: NextRequest) {
  console.log("***** DELIST ITEM API CALLED *****");

  const middlewareResponse = await apiKeyMiddleware(
    ["inscription"],
    "write",
    []
  )(req);

  if (middlewareResponse) {
    return middlewareResponse;
  }
  const orderInput: OrderInput = await req.json();

  // Ensure orderInput contains all necessary fields
  const requiredFields = [
    "seller_receive_address",
    "inscription_id",
    "tap_internal_key",
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
      const inscription = await Inscription.findOne({
        inscription_id: ordItem.inscription_id,
      });
      if (inscription) {
        valueChecks(inscription, ordItem);
        // If the document already exists, update it with the new fields
        inscription.listed_price_per_token = 0;
        inscription.listed_token = "";
        inscription.listed_amount = 0;
        inscription.listed = false;
        inscription.listed_at = new Date();
        inscription.listed_price = 0;
        inscription.listed_seller_receive_address =
          orderInput.seller_receive_address;
        inscription.signed_psbt = "";
        inscription.unsigned_psbt = "";
        inscription.listed_maker_fee_bp = 100;
        inscription.tap_internal_key = "";
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
