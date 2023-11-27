import { NextRequest, NextResponse } from "next/server";
import { Inscription } from "@/models";
import axios from "axios";
import dbConnect from "@/lib/dbConnect";
import crypto from "crypto";
import { fetchContentFromProviders } from "@/utils";
import { IInscription } from "@/types";
import moment from "moment";

// Function to fetch details of a single inscription
async function fetchInscriptionDetails(
  inscriptionId: string
): Promise<
  Partial<IInscription> | { error: true; error_tag: string; error_retry: 1 }
> {
  try {
    const { data } = await axios.get(
      `${process.env.NEXT_PUBLIC_PROVIDER}/api/inscription/${inscriptionId}`
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

    return {
      ...data,
      timestamp: moment.unix(data.timestamp),
      sat_timestamp: moment.unix(data.sat_timestamp),
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

// Main handler function
export async function GET(req: NextRequest): Promise<NextResponse> {
  const bulkOps: any[] = [];

  try {
    await dbConnect();
    const highestInscription = await Inscription.findOne().sort({
      inscription_number: -1,
    });
    const start = highestInscription
      ? highestInscription.inscription_number
      : -1;

    const savedInscriptionIds: string[] = [];
    const BATCH = 300;

    const url = `${process.env.NEXT_PUBLIC_PROVIDER}/api/inscriptions/${
      start + BATCH
    }/${BATCH}`;
    console.log(url, "URL");
    const inscriptionsRes = await axios.get(url);
    const inscriptionIdList = inscriptionsRes.data.inscriptions.reverse();

    // Fetch inscriptions asynchronously
    const promises = inscriptionIdList.map(
      async (inscriptionId: string, index: number) => {
        if (!inscriptionId) return;
        let tags: string[] = [];
        let content = null;
        let sha;
        let token = false;
        let contentType = null;
        let contentResponse = null;
        let domain_name = null;

        try {
          contentResponse = await fetchContentFromProviders(inscriptionId);
          contentType = contentResponse.headers["content-type"];

          if (/text|html|json|javascript/.test(contentType)) {
            content = contentResponse.data;

            try {
              const domainPattern =
                /^(?!\d+\.)[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.[a-zA-Z]+$/;
              if (domainPattern.test(content) && !tags.includes("domain")) {
                tags.push("domain");
              }

              // Check if content is a bitmap pattern (number followed by .bitmap)
              const bitmapPattern = /^\d+\.bitmap$/;
              if (bitmapPattern.test(content)) {
                tags.push("bitmap");
              }
              const parsedContent = JSON.parse(content.toString("utf-8"));

              if (parsedContent.p === "brc-20") {
                tags.push("brc-20");
                tags.push("token");
                token = true;
              } else if (
                parsedContent.p === "brc-21" ||
                parsedContent.p.includes("orc")
              ) {
                tags.push("token");
                token = true;
              } else if (
                parsedContent.p &&
                parsedContent.tick &&
                (parsedContent.amt || parsedContent.dep)
              ) {
                token = true;
                tags.push("token");
              } else if (
                parsedContent.p === "sns" &&
                parsedContent.op === "reg" &&
                parsedContent.name
              ) {
                if (typeof parsedContent.name === "string") {
                  tags.push("domain");
                  domain_name = parsedContent.name;
                }
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

        let inscriptionDetails: any = {};
        if (!token) {
          // if content is not a token
          inscriptionDetails = await fetchInscriptionDetails(inscriptionId);
        } else {
          inscriptionDetails.inscription_number = start + 1 + index;
        }
        tags = tags.filter((tag) => tag).map((tag) => tag.toLowerCase());
        bulkOps.push({
          insertOne: {
            document: {
              inscription_id: inscriptionId,
              content_type: contentType,
              ...(token ||
              !contentResponse ||
              !sha ||
              /image|audio|zip|video/.test(contentType)
                ? {}
                : { content: contentResponse.data.toString("utf-8") }),
              ...(sha && { sha }),
              ...(token && { token }),
              ...(domain_name && { domain_name }),
              tags,
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
      return (
        a.insertOne.document.inscription_number -
        b.insertOne.document.inscription_number
      );
    });

    const transformedBulkDocs = await handlePreSaveLogic(bulkOps);

    const bulkWriteOperations = transformedBulkDocs.map((transformedDoc) => {
      return {
        insertOne: {
          document: transformedDoc,
        },
      };
    });

    // await deleteInscriptionsAboveThreshold(43038000);

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
      body: { message: "Error fetching and saving inscriptions", bulkOps },
    });
  }
}

const handlePreSaveLogic = async (bulkDocs: Array<Partial<any>>) => {
  const transformedBulkOps: any[] = [];
  const shaMap: { [sha: string]: number } = {};

  // Pre-compute the maximum existing version for each unique SHA
  const uniqueShas = [
    ...new Set(bulkDocs.map((doc) => doc.insertOne.document.sha)),
  ];
  for (const sha of uniqueShas) {
    if (sha) {
      const latestDocumentWithSameSha = await Inscription.findOne({
        sha: sha,
      }).sort({ version: -1 });
      shaMap[sha] = latestDocumentWithSameSha
        ? latestDocumentWithSameSha.version
        : 0;
    }
  }

  for (let i = 0; i < bulkDocs.length; i++) {
    let bulkDoc = { ...bulkDocs[i] };
    const insertOne = bulkDoc.insertOne;
    const doc = insertOne.document;

    if (i === 0 && doc.inscription_number > 0) {
      const prevDocument = await Inscription.findOne({
        inscription_number: doc.inscription_number - 1,
      });

      if (!prevDocument || !prevDocument.inscription_id) {
        throw new Error(
          `A document with number ${
            doc.inscription_number - 1
          } does not exist or inscriptionId is missing in it`
        );
      }
    } else if (i > 0) {
      let prevBulkDoc = { ...bulkDocs[i - 1] };
      const prevInsertOne = prevBulkDoc.insertOne;
      const prevDoc = prevInsertOne.document;
      if (
        !prevDoc ||
        prevDoc.inscription_number !== doc.inscription_number - 1 ||
        !prevDoc.inscription_id
      ) {
        throw new Error(
          `A document with number ${
            doc.inscription_number - 1
          } does not exist or inscription_id is missing in it`
        );
      }
    }

    // Updated SHA version logic
    if (doc.sha && !doc.token) {
      // console.log(doc.sha, " Working on this SHA");

      if (shaMap[doc.sha] != null) {
        shaMap[doc.sha]++;
      } else {
        shaMap[doc.sha] = 1;
      }
      doc.version = shaMap[doc.sha];
    }

    if (doc.content_type && doc.content_type.includes("/")) {
      const contentTypeParts = doc.content_type.split("/");
      doc.tags = doc.tags
        ? [
            ...doc.tags
              .filter((tag: string) => tag)
              .map((tag: string) => tag.toLowerCase()),
            ...contentTypeParts
              .filter((part: string) => part)
              .map((part: string) => part.toLowerCase()),
          ]
        : contentTypeParts
            .filter((part: string) => part)
            .map((part: string) => part.toLowerCase());
    }
    transformedBulkOps.push(doc);
  }

  // console.log(uniqueShas, "UNIQUESHAS");
  console.log(shaMap, "SHAMAP");
  return transformedBulkOps;
};

const deleteInscriptionsAboveThreshold = async (number: number) => {
  try {
    const result = await Inscription.deleteMany({
      inscription_number: { $gt: number },
    });

    console.log(`Successfully deleted ${result.deletedCount} documents.`);
  } catch (err) {
    console.error("An error occurred while deleting documents:", err);
  }
};

export const dynamic = "force-dynamic";
