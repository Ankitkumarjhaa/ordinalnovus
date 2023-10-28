import { NextRequest, NextResponse } from "next/server";
import { Inscription } from "@/models";
import axios from "axios";
import dbConnect from "@/lib/dbConnect";
import { IInscription } from "@/types/Ordinals";
import moment from "moment";

// Function to fetch details of a single inscription
async function fetchInscriptionDetails(
  inscription: IInscription
): Promise<
  Partial<IInscription> | { error: true; error_tag: string; error_retry: 1 }
> {
  try {
    let tags = inscription.tags ? [...inscription.tags] : [];
    let token = false;
    let domain_name = null;
    const { data } = await axios.get(
      `${process.env.NEXT_PUBLIC_PROVIDER}/api/inscription/${inscription.inscription_id}`
    );
    if (!data.sat) {
      console.log(data, "DATA");
      if (
        !data.inscription_number &&
        !data.genesis_transaction &&
        !data.genesis_height
      )
        throw Error("server down");
      else {
        return {
          ...data,
          error: true,
          error_tag: "unbound item",
          error_retry: 1,
        };
      }
    }

    if (
      inscription.content &&
      inscription.content_type &&
      /text|html|json|javascript/.test(inscription.content_type)
    ) {
      const content = inscription.content;

      try {
        const domainPattern =
          /^(?!\d+\.)[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.[a-zA-Z]+$/;
        if (domainPattern.test(content) && !tags.includes("domain")) {
          tags.push("domain");
        }

        // Check if content is a bitmap pattern (number followed by .bitmap)
        const bitmapPattern = /^\d+\.bitmap$/;
        if (bitmapPattern.test(content) && !tags.includes("bitmap")) {
          tags.push("bitmap");
        }
        const parsedContent = await JSON.parse(content);

        if (parsedContent.p === "brc-20") {
          if (!tags.includes("brc-20")) tags.push("brc-20");
          if (!tags.includes("token")) tags.push("token");
          if (!token) token = true;
        } else if (
          parsedContent.p === "brc-21" ||
          parsedContent.p.includes("orc")
        ) {
          if (!tags.includes("token")) tags.push("token");
          token = true;
        } else if (parsedContent.p && parsedContent.tick && parsedContent.amt) {
          token = true;
          if (!tags.includes("token")) tags.push("token");
        } else if (
          parsedContent.p === "sns" &&
          parsedContent.op === "reg" &&
          parsedContent.name
        ) {
          if (typeof parsedContent.name === "string") {
            if (!tags.includes("domain")) tags.push("domain");
            domain_name = parsedContent.name;
          }
        }
      } catch (error) {}
    }

    return {
      inscription_id: inscription.inscription_id,
      inscription_number: inscription.inscription_number,
      timestamp: moment.unix(data.timestamp),

      ...(token
        ? {}
        : {
            address: data.address,
            sat_timestamp: moment.unix(data.sat_timestamp),
            location: data.location,
            sat: data.sat,
            output: data.output,
            offset: data.offset,
            output_value: data.output_value,
          }),
      ...(token && { token }),
      ...(domain_name && { domain_name }),
      tags,
    };
  } catch (error: any) {
    if (
      error.response &&
      (error.response.status === 500 || error.response.status === 502)
    ) {
      return { error: true, error_tag: "server error", error_retry: 1 };
    }
    throw error;
  }
}

async function fetchInscriptionsWithoutSat() {
  await dbConnect();
  return Inscription.find({ sat: { $exists: false }, token: false })
    .sort({ inscription_number: 1 })
    .limit(300)
    .skip(2000);
}

async function updateInscriptions(inscriptions: any) {
  const bulkOps = inscriptions.map((inscription: IInscription) => ({
    updateOne: {
      filter: { _id: inscription._id },
      update: { ...inscription },
      //   upsert: true,
    },
  }));
  if (bulkOps.length > 0) {
    return Inscription.bulkWrite(bulkOps);
  }
}

// Main handler function
export async function GET(req: NextRequest): Promise<NextResponse> {
  const bulkOps: any[] = [];

  try {
    const inscriptionsWithoutSat = await fetchInscriptionsWithoutSat();
    if (inscriptionsWithoutSat.length < 1)
      return NextResponse.json({ message: "All inscriptions have sat" });

    const promises = inscriptionsWithoutSat.map(async (inscription) => {
      const inscriptionDetails = await fetchInscriptionDetails(inscription);
      return { _id: inscription._id, ...inscriptionDetails };
    });
    const updatedInscriptions = await Promise.all(promises);

    await updateInscriptions(updatedInscriptions);

    return NextResponse.json({
      message: "Inscriptions fetched and saved successfully",
      savedInscriptions: updatedInscriptions,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({
      status: 400,
      body: { message: "Error fetching and saving inscriptions", bulkOps },
    });
  }
}

export const dynamic = "force-dynamic";
