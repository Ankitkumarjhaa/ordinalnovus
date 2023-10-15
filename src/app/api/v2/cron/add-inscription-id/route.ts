import { NextRequest, NextResponse } from "next/server";
import { Inscription } from "@/models";
import axios from "axios";
import dbConnect from "@/lib/dbConnect";
import crypto from "crypto";
import { fetchContentFromProviders } from "@/utils";
import { IInscription } from "@/types/Ordinals";
import { AnyBulkWriteOperation } from "mongodb";

// Function to fetch details of a single inscription
async function fetchInscriptionDetails(
  inscriptionId: string
): Promise<Partial<IInscription> | { error: true }> {
  try {
    const { data } = await axios.get(
      `${process.env.NEXT_PUBLIC_PROVIDER}/api/inscription/${inscriptionId}`
    );
    if (!data.sat) throw Error("server down");

    return {
      ...data,
      timestamp: new Date(data.timestamp),
      preview: data._links.preview.href.split("/")[2],
    };
  } catch (error: any) {
    if (
      error.response &&
      (error.response.status === 500 || error.response.status === 502)
    ) {
      return { error: true };
    }
    throw error;
  }
}

// Main handler function
export async function GET(req: NextRequest): Promise<NextResponse> {
  await dbConnect();

  try {
    console.log("ADDING NEW INSCRIPTIONS");
    const highestInscription = await Inscription.findOne().sort({ number: -1 });
    const start = highestInscription ? highestInscription.number + 1 : 0;
    const { data } = await axios.get(
      `${process.env.NEXT_PUBLIC_PROVIDER}/api/feed`
    );
    const total = data.total;
    const bulkOps: AnyBulkWriteOperation<any>[] = [];
    const savedInscriptionIds: string[] = [];

    // Fetch inscriptions asynchronously
    const promises = Array.from(
      { length: Math.min(200, total - start) },
      async (_, i) => {
        const currentNumber = start + i;
        const url = `${process.env.NEXT_PUBLIC_PROVIDER}/api/inscriptions/${currentNumber}`;
        const { data } = await axios.get(url);
        const inscriptionId = data.inscriptions[0];

        if (!inscriptionId) return;

        // console.log(inscriptionId, "ID");

        let content = null;
        let sha;
        let brc20 = false;
        let token = false;
        let contentType = null;
        let contentResponse = null;

        try {
          contentResponse = await fetchContentFromProviders(inscriptionId);
          contentType = contentResponse.headers["content-type"];

          if (/text|html|json|javascript/.test(contentType)) {
            content = contentResponse.data;

            try {
              const parsedContent = JSON.parse(content.toString("utf-8"));

              if (parsedContent.p === "brc-20") {
                brc20 = true;
                token = true;
              }
              if (
                parsedContent.p === "brc-21" ||
                parsedContent.p.includes("orc")
              ) {
                token = true;
              }
            } catch (error) {
              // console.log("Error parsing JSON:", error);
            }

            if (!token) {
              // if content is not a token
              if (typeof content === "object") {
                content = contentResponse.data.toString("utf-8");
              }
              sha = crypto
                .createHash("sha256")
                .update(content, "utf8")
                .digest("hex");
            }
          } else if (!token && !/video|audio/.test(contentType)) {
            // if content is not a token or video/audio
            sha = crypto
              .createHash("sha256")
              .update(contentResponse.data)
              .digest("hex");
          }
        } catch (e) {}

        let inscriptionDetails = {};
        if (!token) {
          // if content is not a token
          inscriptionDetails = await fetchInscriptionDetails(inscriptionId);
        }

        bulkOps.push({
          insertOne: {
            document: {
              inscriptionId,
              number: currentNumber,
              content_type: contentType,
              ...(token || !contentResponse
                ? {}
                : { content: contentResponse.data.toString("utf-8") }), // Only store content if it's not a token
              sha,
              brc20,
              token,
              ...inscriptionDetails,
            },
          },
        });
        savedInscriptionIds.push(inscriptionId);
      }
    );

    await Promise.all(promises);

    if (bulkOps.length > 0) await Inscription.bulkWrite(bulkOps);
    return NextResponse.json({
      message: "Inscriptions fetched and saved successfully",
      savedInscriptionIds,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({
      status: 400,
      body: { message: "Error fetching and saving inscriptions" },
    });
  }
}
export const dynamic = "force-dynamic";
