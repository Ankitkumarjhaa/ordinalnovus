import { NextApiRequest, NextApiResponse } from "next";
import { Collection, Inscription } from "@/models";
import fs from "fs";
import path from "path";
import dbConnect from "@/lib/dbConnect";

const FAILED_COLLECTIONS_FILE = "failed_collections.json";
const failedCollectionsFilePath = path.join(
  __dirname,
  "../../../../",
  FAILED_COLLECTIONS_FILE
);

const REPO_OWNER = "ordinals-wallet"; // GitHub username or organization name
const REPO_NAME = "ordinals-collections"; // Repository name

const BRANCH_AND_DIRECTORY = "main:collections"; // Replace with branch:subdirectory

const CONCURRENT_OPERATIONS_LIMIT = parseInt(
  process.env.CONCURRENT_OPERATIONS_LIMIT || "5"
);
const MAX_COLLECTIONS = parseInt(process.env.MAX_COLLECTIONS || "5");

// ... other functions (loadFailedCollections, saveFailedCollection, validateUrl) remain unchanged
function loadFailedCollections() {
  if (!fs.existsSync(failedCollectionsFilePath)) {
    fs.writeFileSync(failedCollectionsFilePath, JSON.stringify([]));
  }
  const rawData = fs.readFileSync(failedCollectionsFilePath);
  return JSON.parse(rawData.toString());
}

function saveFailedCollection(collectionSlug: string) {
  let failedCollections = loadFailedCollections();

  if (!failedCollections.includes(collectionSlug)) {
    failedCollections.push(collectionSlug);
    fs.writeFileSync(
      failedCollectionsFilePath,
      JSON.stringify(failedCollections)
    );
    console.log(`Added ${collectionSlug} to failed_collections.json`);
  } else {
    console.log(`${collectionSlug} is already in failed_collections.json`);
  }
}

function validateUrl(v: string) {
  const urlPattern =
    /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
  return v ? urlPattern.test(v) : true;
}
const importCollections = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed. Use POST." });
  }

  try {
    await dbConnect();
  } catch (error) {
    console.error("Database connection error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }

  try {
    const failedCollections = loadFailedCollections();
    const existingSlugs = await Collection.find({}).distinct("slug");
    const excludedSlugs = failedCollections.concat(existingSlugs);

    const query = `
      query($owner: String!, $repo: String!, $expression: String!) {
        repository(name: $repo, owner: $owner) {
          object(expression: $expression) {
            ... on Tree {
              entries {
                name
                type
              }
            }
          }
        }
      }
    `;

    const variables = {
      owner: REPO_OWNER,
      repo: REPO_NAME,
      expression: BRANCH_AND_DIRECTORY,
    };

    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GITHUB_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({ query, variables }),
    });

    console.log({ query, variables }, "PARAMS");
    const data = await response.json();
    console.log(data, "DATA");
    const collectionsEntries = data.data.repository.object.entries;
    console.log(collectionsEntries.length, "CE");
    const collectionsFolders = collectionsEntries
      .filter((item: { type: string }) => item.type === "tree")
      .filter((item: { name: any }) => !excludedSlugs.includes(item.name));

    // ... rest of the code for processing collections remains unchanged

    console.log(collectionsFolders.length, "TOTAL COLLECTIONS TO PROCESS");

    let counter = 0;
    const processCollection = async (folder: any) => {
      try {
        const metaResponse = await fetch(
          `https://raw.githubusercontent.com/ordinals-wallet/ordinals-collections/main/collections/${folder.name}/meta.json`
        );

        if (!metaResponse.ok) {
          throw new Error("Failed to fetch meta data");
        }

        const metaData = await metaResponse.json();
        console.log("got metadata for ", folder.name);
        console.log({
          supply: Number(metaData.supply),
          icon: metaData.inscription_icon || metaData.icon,
        });
        if (
          // Number(metaData.supply) > 0 &&
          (metaData.inscription_icon || metaData.icon) &&
          !metaData.inscription_icon.includes("https://") &&
          !metaData.inscription_icon.includes(".")
        ) {
          console.log("processing...");
          // if (metaData.slug.includes(".")) {
          //   console.log(metaData.slug, "SLUG has . ");
          //   saveFailedCollection(folder.name);
          //   metaData.slug = metaData.slug.split(".").join("-");
          // }
          if (metaData.twitter_link && !validateUrl(metaData.twitter_link)) {
            console.log("invalid_twitter link");
            saveFailedCollection(folder.name);
            return;
          }
          if (metaData.discord_link && !validateUrl(metaData.discord_link)) {
            console.log("invalid discord_link");
            saveFailedCollection(folder.name);
            return;
          }

          if (metaData.website_link && !validateUrl(metaData.website_link)) {
            console.log("invalid website link");
            saveFailedCollection(folder.name);
            return;
          }

          console.log("passed all checks");

          metaData.live = true;
          metaData.type = "official";
          metaData.updatedBy = "cronjob";
          metaData.supply =
            Number(metaData.supply) > 0 ? Number(metaData.supply) : null;

          if (!metaData.description) {
            metaData.description = `${metaData.name} is a collection with ${metaData.supply} items forever inscribed on the BTC Blockchain.`;
          }

          const inscription = await Inscription.findOne({
            inscriptionId: metaData.inscription_icon,
          });

          if (inscription) {
            metaData.inscription_icon = inscription._id;
          } else {
            console.log(
              "adding to err file because inscription_icon wasnt found in db: ",
              folder.name
            );
            return saveFailedCollection(folder.name);
          }

          const existingCollection = await Collection.findOne({
            slug: metaData.slug,
          });

          if (!existingCollection) {
            console.log("saved ", folder.name);
            const newCollection = new Collection(metaData);
            await newCollection.save();
            counter++;
          } else {
            console.log("collection already in DB");
            saveFailedCollection(folder.name);
          }
        } else {
          console.log("not processing...");
          saveFailedCollection(folder.name);
          if (Number(metaData.supply) === 0) {
            console.log("Skipping because of no supply field");
          } else if (
            !metaData.inscription_icon ||
            metaData.inscription_icon.includes("https://") ||
            metaData.inscription_icon.includes(".")
          ) {
            console.log("skipping because of wrong inscription_icon");
          }
        }
      } catch (error) {
        console.error("Error processing collection:", error);
        saveFailedCollection(folder.name);
      }
    };

    // Process collections in chunks
    try {
      while (collectionsFolders.length && counter < MAX_COLLECTIONS) {
        const foldersChunk = collectionsFolders.splice(
          0,
          CONCURRENT_OPERATIONS_LIMIT
        );
        await Promise.all(
          foldersChunk.map((folder: any) => processCollection(folder))
        );
      }

      return res.status(200).json({
        message: "Collections imported successfully",
        count: counter,
      });
    } catch (error) {
      console.error("Error in processing collections while block :", error);
      return res
        .status(500)
        .json({ message: "Error in processing collections" });
    }
  } catch (error) {
    console.error("General error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export default importCollections;
