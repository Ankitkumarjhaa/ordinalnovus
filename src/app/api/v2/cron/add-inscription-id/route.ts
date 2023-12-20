import { NextRequest, NextResponse } from "next/server";
import { Inscription } from "@/models";
import axios from "axios";
import dbConnect from "@/lib/dbConnect";
import crypto from "crypto";
import fetchContentFromProviders from "@/utils/api/fetchContentFromProviders";
import { IInscription } from "@/types";
import moment from "moment";
import { domain_format_validator } from "@/utils";
import { getCache, setCache } from "@/lib/cache";
import { sendEmailAlert } from "@/utils/sendEmailAlert";

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
    if (error.response && error.response.status === 404) {
      // Check if the error message matches the pattern
      if (error.response.data === `${inscriptionId} not found`) {
        // Set cache to pause processing for 5 minutes
        await setCache(`pauseProcess`, "true", 300); // 300 seconds = 5 minutes
        return { error: true, error_tag: "not found", error_retry: 1 };
      }
    }
    if (
      error.response &&
      (error.response.status === 500 || error.response.status === 502)
    ) {
      const cacheKey = "addInscriptionAlert";
      const cache = await getCache(cacheKey);
      if (!cache) {
        try {
          await sendEmailAlert({
            subject: "Inscriptions Processing Stopped",
            html: `<h1>Ordinalnovus Email Alert</h1><br/>
              <p>Inscriptions Processing Stopped<p><br/>
              <p>Inscription Number: ${inscriptionId}</p><br/>`,
          });

          setCache(cacheKey, { emailSent: true }, 2 * 60 * 60);
        } catch {}
      }
      return { error: true, error_tag: "server error", error_retry: 1 };
    }
    throw error;
  }
}

async function checkDomainValid(domain: string) {
  if (!domain) return false;
  const domainPattern =
    /^(?!\d+\.)[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.[a-zA-Z]+$/;
  if (!domainPattern.test(domain)) return false;
  const olderValidDomain = await Inscription.findOne({
    domain_name: domain.toLowerCase().trim(),
    domain_valid: true,
  });
  if (!olderValidDomain) return true;
  else return false;
}

// Main handler function
export async function GET(req: NextRequest): Promise<NextResponse> {
  const bulkOps: any[] = [];
  const savedInscriptions: number[] = [];
  const cachedValue = await getCache(`pauseProcess`);
  if (cachedValue) {
    return NextResponse.json({
      message: "Processing paused for 5 minutes. All inscriptions processed",
    });
  }

  try {
    await dbConnect();
    const highestInscription = await Inscription.findOne().sort({
      inscription_number: -1,
    });
    const start = highestInscription
      ? highestInscription.inscription_number + 1
      : -1;

    const BATCH = 100;

    // Initialize the array with undefined values, then map each element to its incremented value.
    const inscriptionArray = Array.from(
      { length: BATCH },
      (_, index) => start + index
    );

    console.log({ inscriptionArray });

    // await deleteInscriptionsAboveThreshold(47062404);
    // return NextResponse.json({});
    // Fetch inscriptions asynchronously
    const promises = inscriptionArray.map(
      async (inscription_number: string, index: number) => {
        if (!inscription_number) return;
        let tags: string[] = [];
        let content = null;
        let sha;
        let token = false;
        let contentType = null;
        let contentResponse = null;
        let domain_name = null;
        let domain_valid = false;

        try {
          contentResponse = await fetchContentFromProviders(inscription_number);
          contentType = contentResponse.headers["content-type"];

          if (/text|html|json|javascript/.test(contentType)) {
            content = contentResponse.data;

            try {
              const domainPattern =
                /^(?!\d+\.)[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.[a-zA-Z]+$/;
              if (
                domainPattern.test(content) &&
                !tags.includes("domain") &&
                domain_format_validator(content)
              ) {
                tags.push("domain");
                domain_name = domain_format_validator(content);
                domain_valid = await checkDomainValid(content);
              }

              // Check if content is a bitmap pattern (number followed by .bitmap)
              const bitmapPattern = /^\d+\.bitmap$/;
              if (bitmapPattern.test(content)) {
                tags.push("bitmap");
              }

              if (content.startsWith("cbrc-20:")) {
                tags.push("cbrc");
                tags.push("token");
                token = true;
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
                parsedContent.amt
              ) {
                token = true;
                tags.push("token");
              } else if (
                parsedContent.p &&
                parsedContent.op &&
                (parsedContent.dep || parsedContent.tick || parsedContent.amt)
              ) {
                token = true;
                tags.push("token");
                tags.push("dmt");
              } else if (
                parsedContent.p === "sns" &&
                parsedContent.op === "reg" &&
                parsedContent.name
              ) {
                if (
                  typeof parsedContent.name === "string" &&
                  domain_format_validator(parsedContent.name)
                ) {
                  tags.push("domain");
                  domain_name = parsedContent.name;
                  domain_valid = await checkDomainValid(parsedContent.name);
                }
              }
            } catch (error) {}

            if (!token) {
              // if content is not a token
              if (typeof content === "object") {
                content = contentResponse.data.toString("utf-8");
              }
              // handle multiple tap mints like inscription 46225391
              if (
                content.includes(`"p":`) &&
                content.includes(`"op":`) &&
                (content.includes(`"tick":`) || content.includes(`"amt":`))
              ) {
                if (!tags.includes("token")) tags.push("token");
                token = true;
              }

              if (!token)
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
        inscriptionDetails = await fetchInscriptionDetails(inscription_number);
        tags = tags.filter((tag) => tag).map((tag) => tag.toLowerCase());

        if (inscriptionDetails.metadata)
          inscriptionDetails.metadata = new Map(
            Object.entries(inscriptionDetails.metadata)
          );

        if (inscriptionDetails.metaprotocol)
          console.log(inscriptionDetails.metaprotocol, "PARSED");
        if (
          inscriptionDetails.metaprotocol &&
          inscriptionDetails.metaprotocol?.startsWith("cbrc-20")
        ) {
          token = true;
          tags.push("token");
          tags.push("cbrc");
        }
        if (inscriptionDetails.metaprotocol)
          inscriptionDetails.parsed_metaprotocol =
            inscriptionDetails?.metaprotocol;
        // .split(":")
        // .map((element: string) => element.trim());

        bulkOps.push({
          insertOne: {
            document: {
              content_type: contentType,
              ...((token && !tags.includes("cbrc")) ||
              !contentResponse ||
              !sha ||
              /image|audio|zip|video/.test(contentType)
                ? {}
                : { content: contentResponse.data.toString("utf-8") }),
              ...(sha &&
                (!inscriptionDetails.metaprotocol ||
                  !inscriptionDetails.metaprotocol.includes("transfer")) && {
                  sha,
                }),
              ...(token && { token }),
              ...(domain_name && {
                domain_name: domain_name?.toLowerCase().trim(),
              }),
              ...(content && { domain_valid }),
              tags,
              ...inscriptionDetails,
            },
          },
        });

        savedInscriptions.push(Number(inscription_number));
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

    savedInscriptions.sort((a, b) => {
      return a - b;
    });

    const transformedBulkDocs = await handlePreSaveLogic(bulkOps);

    const bulkWriteOperations = transformedBulkDocs.map((transformedDoc) => {
      return {
        insertOne: {
          document: transformedDoc,
        },
      };
    });

    if (bulkWriteOperations.length > 0)
      await Inscription.bulkWrite(bulkWriteOperations);
    return NextResponse.json({
      message: "Inscriptions fetched and saved successfully",
      stats: {
        saved: savedInscriptions.length,
      },
      // savedInscriptions,
      // bulkWriteOperations,
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

  let domainMap: { [domain_name: string]: number } = {};
  // domain processing
  // Unique domain pre-processing
  bulkDocs.forEach((doc) => {
    if (doc.insertOne.document.domain_name) {
      const domainName = doc.insertOne.document.domain_name
        .toLowerCase()
        .trim();
      if (domainName) {
        if (!(domainName in domainMap)) {
          domainMap[domainName] = 0; // Set initial count to 0
        }
      }
    }
  });

  for (let i = 0; i < bulkDocs.length; i++) {
    let bulkDoc = { ...bulkDocs[i] };
    const insertOne = bulkDoc.insertOne;
    const doc = insertOne.document;

    // Domain name validation logic
    // db validation already done.
    // now we are comparing to data in this array itself
    // Domain name validation logic
    if (doc.domain_name && doc.domain_valid) {
      if (domainMap[doc.domain_name] === 0) {
        // First instance of domain name
        doc.domain_valid = true; // Set to true if needed
        domainMap[doc.domain_name]++;
      } else {
        // Duplicate domain name found
        doc.domain_valid = false;
      }
    }

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

  console.debug(shaMap, "SHAMAP");
  return transformedBulkOps;
};

const deleteInscriptionsAboveThreshold = async (number: number) => {
  try {
    const result = await Inscription.deleteMany({
      inscription_number: { $gt: number },
    });

    console.debug(`Successfully deleted ${result.deletedCount} documents.`);
  } catch (err) {
    console.error("An error occurred while deleting documents:", err);
  }
};

export const dynamic = "force-dynamic";
