import { NextRequest, NextResponse } from "next/server";
import { Inscription } from "@/models";
import axios from "axios";
import dbConnect from "@/lib/dbConnect";
import crypto from "crypto";
import { fetchContentFromProviders } from "@/utils";
import { IInscription } from "@/types/Ordinals";

// Function to fetch details of a single inscription
async function fetchInscriptionDetails(
  inscriptionId: string
): Promise<Partial<IInscription> | { error: true; error_tag: string }> {
  try {
    const { data } = await axios.get(
      `${process.env.NEXT_PUBLIC_PROVIDER}/api/inscription/${inscriptionId}`
    );
    if (!data.sat) throw Error("server down");
    const dateObject = new Date(data.timestamp);

    return {
      ...data,
      timestamp: dateObject,
      preview: data._links.preview.href.split("/")[2],
    };
  } catch (error: any) {
    if (
      error.response &&
      (error.response.status === 500 || error.response.status === 502)
    ) {
      return { error: true, error_tag: "server error" };
    }
    throw error;
  }
}

// Main handler function
export async function GET(req: NextRequest): Promise<NextResponse> {
  await dbConnect();

  try {
    const highestInscription = await Inscription.findOne().sort({ number: -1 });
    const start = highestInscription ? highestInscription.number + 1 : 0;
    const { data } = await axios.get(
      `${process.env.NEXT_PUBLIC_PROVIDER}/api/feed`
    );
    const total = data.total;
    const bulkOps: any[] = [];
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
        let tags = [];
        let content = null;
        let sha;
        let token = false;
        let contentType = null;
        let contentResponse = null;

        try {
          contentResponse = await fetchContentFromProviders(inscriptionId);
          contentType = contentResponse.headers["content-type"];

          if (/text|html|json|javascript/.test(contentType)) {
            content = contentResponse.data;

            try {
              if (/^\d+\.bitmap$/.test(content)) {
                tags.push("bitmap");
              } else if (/^[a-zA-Z0-9]+\.sats$/.test(content)) {
                tags.push("domain");
              }
              const parsedContent = JSON.parse(content.toString("utf-8"));

              if (parsedContent.p === "brc-20") {
                tags.push("brc-20");
                tags.push("token");
                token = true;
              }
              if (
                parsedContent.p === "brc-21" ||
                parsedContent.p.includes("orc")
              ) {
                tags.push("token");
                token = true;
              }
            } catch (error) {}

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
              inscription_id: inscriptionId,
              number: currentNumber,
              content_type: contentType,
              ...(token || !contentResponse
                ? {}
                : { content: contentResponse.data.toString("utf-8") }), // Only store content if it's not a token
              sha,
              token,
              ...inscriptionDetails,
            },
          },
        });
        savedInscriptionIds.push(inscriptionId);
      }
    );

    await Promise.all(promises);

    // Sort the bulkOps array based on the 'number' field in ascending order
    bulkOps.sort((a, b) => {
      return a.insertOne.document.number - b.insertOne.document.number;
    });

    const transformedBulkDocs = await handlePreSaveLogic(bulkOps);

    const bulkWriteOperations = transformedBulkDocs.map((transformedDoc) => {
      return {
        insertOne: {
          document: transformedDoc,
        },
      };
    });

    // Perform the bulk insert after transformations are done
    if (bulkWriteOperations.length > 0)
      await Inscription.bulkWrite(bulkWriteOperations);

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

const handlePreSaveLogic = async (bulkDocs: Array<Partial<any>>) => {
  const transformedBulkOps: any[] = [];

  for (let i = 0; i < bulkDocs.length; i++) {
    let bulkDoc = { ...bulkDocs[i] };
    const insertOne = bulkDoc.insertOne;
    const doc = insertOne.document;

    // Check for previous document if this is a new document
    if (i === 0 && doc.number > 0) {
      const prevDocument = await Inscription.findOne({
        number: doc.number - 1,
      });

      if (!prevDocument || !prevDocument.inscription_id) {
        throw new Error(
          `A document with number ${
            doc.number - 1
          } does not exist or inscriptionId is missing in it`
        );
      }
    } else if (i > 0) {
      let prevBulkDoc = { ...bulkDocs[i - 1] };
      const prevInsertOne = prevBulkDoc.insertOne;
      const prevDoc = prevInsertOne.document;
      if (
        !prevDoc ||
        prevDoc.number !== doc.number - 1 ||
        !prevDoc.inscription_id
      ) {
        throw new Error(
          `A document with number ${
            doc.number - 1
          } does not exist or inscription_id is missing in it`
        );
      }
    }

    // Increment the version if the SHA exists
    if (doc.sha) {
      const documentsWithSameSha = await Inscription.find({
        sha: doc.sha,
      });

      doc.version =
        documentsWithSameSha.length > 0 ? documentsWithSameSha.length + 1 : 1;
    }

    // Modify the tags if content_type exists and contains a "/"
    if (doc.content_type && doc.content_type.includes("/")) {
      const contentTypeParts = doc.content_type.split("/");
      doc.tags = doc.tags
        ? [
            ...doc.tags,
            contentTypeParts[0].toLowerCase(),
            contentTypeParts[1].toLowerCase(),
          ]
        : [
            contentTypeParts[0].toLowerCase(),
            contentTypeParts[1].toLowerCase(),
          ];
    }

    transformedBulkOps.push(doc);
  }

  return transformedBulkOps;
};
