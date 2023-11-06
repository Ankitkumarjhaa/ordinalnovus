import { NextRequest, NextResponse } from "next/server";
import { Collection, Inscription } from "@/models";
import dbConnect from "@/lib/dbConnect";

const REPO_OWNER = "ordinals-wallet"; // GitHub username or organization name
const REPO_NAME = "ordinals-collections"; // Repository name

const BRANCH_AND_DIRECTORY = "main:collections"; // Replace with branch:subdirectory

function validateUrl(v: string) {
  const urlPattern =
    /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
  return v ? urlPattern.test(v) : true;
}

function validateSlug(v: string) {
  return v ? /^[a-zA-Z0-9-_.]+$/.test(v) : true;
}
export async function GET(req: NextRequest, res: NextResponse) {
  try {
    console.log("***** ADD COLLECTION CRONJOB CALLED *****");
    let successfulSlugs: any[] = [];
    let unsuccessfulSlugs: any[] = [];

    await dbConnect();
    const existingSlugs = await Collection.find({}).distinct("slug");

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

    // console.log({ query, variables }, "PARAMS");
    const data = await response.json();
    // console.dir(data, "DATA");

    const excludeSlugs = [
      "blup",
      "plastic-bag-rabbits",
      "wise-monkeys",
      "skapes ordinals",
      "roboiz ordinals",
    ];
    const collectionsEntries = data.data.repository.object.entries;
    console.log(collectionsEntries.length, "CE");
    const collectionsFolders = collectionsEntries
      .filter((item: { type: string }) => item.type === "tree")
      .filter(
        (item: { name: any }) =>
          !existingSlugs.includes(item.name) &&
          !excludeSlugs.includes(item.name)
      );

    console.log(collectionsFolders.length, "TOTAL COLLECTIONS TO PROCESS");
    if (collectionsFolders.length === 0)
      return NextResponse.json({ message: "All Collections added" });

    try {
      const batchLimit = 100;
      const processItems = collectionsFolders.slice(0, batchLimit);
      console.log(processItems.length, " Processing items");

      await Promise.all(
        processItems.map(async (folder: any) => {
          const result = await processCollection(folder);
          console.log(result, "RESULT for ", folder);
          if (result.success) {
            successfulSlugs.push(result.slug);
          } else {
            unsuccessfulSlugs.push(result.slug);
          }
        })
      );

      return NextResponse.json({
        message: "Collections imported partially",
        successful: successfulSlugs,
        unsuccessful: unsuccessfulSlugs,
      });
    } catch (error) {
      console.error("Error in processing collections while block :", error);
      return NextResponse.json(
        { message: "Error processing collection" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("General error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

const processCollection = async (folder: any) => {
  const startTime = performance.now(); // Starting the performance timer
  console.log(`Starting process for folder: ${folder.name}`);

  try {
    const metaResponse = await fetch(
      `https://raw.githubusercontent.com/ordinals-wallet/ordinals-collections/main/collections/${folder.name}/meta.json`
    );

    if (!metaResponse.ok) {
      throw new Error("Failed to fetch meta data");
    }

    const metaData = await metaResponse.json();
    console.log(`Metadata fetched for ${folder.name}`);

    // Process twitter link
    if (metaData.twitter_link && !validateUrl(metaData.twitter_link)) {
      console.log("Invalid Twitter link");
      metaData.twitter_link = "";
    }
    // Process discord link
    if (metaData.discord_link && !validateUrl(metaData.discord_link)) {
      console.log("Invalid Discord link");
      metaData.discord_link = "";
    }
    // Process website link
    if (metaData.website_link && !validateUrl(metaData.website_link)) {
      console.log("Invalid website link");
      metaData.website_link = "";
    }
    console.log("Links verified: ", folder.name);
    // Validate slug
    if (!validateSlug(metaData.slug)) {
      metaData.error = true;
      metaData.error_tag = "Slug invalid";
    }

    metaData.live = true;
    metaData.type = "official";
    metaData.updatedBy = "cronjob";
    metaData.supply = 0;

    // Default description
    if (!metaData.description) {
      metaData.description = `${metaData.name} is a collection forever inscribed on the BTC Blockchain.`;
    }

    // Inscription handling
    const inscription = metaData.inscription_icon
      ? await Inscription.findOne({
          inscription_id: metaData.inscription_icon,
        })
      : null;

    if (metaData.inscription_icon) {
      if (inscription) {
        metaData.inscription_icon = inscription._id;
      } else {
        metaData.inscription_icon = null;
        metaData.error = true;
        metaData.error_tag = "Inscription icon not in db";
        console.log(
          "Adding to error file because inscription_icon wasn't found in db: ",
          folder.name
        );
      }
    } else {
      metaData.inscription_icon = null;
    }
    console.log("Adding collection to the database...", folder.name);

    const newCollection = new Collection(metaData);
    await newCollection.save();
    console.log(`Successfully processed collection for ${folder.name}`);

    const endTime = performance.now(); // Ending the performance timer
    console.log(
      `Processing time for ${folder.name}: ${(endTime - startTime).toFixed(
        2
      )} milliseconds`
    );

    return { success: true, slug: folder.name };
  } catch (error) {
    console.error("Error processing collection:", error);
    return { success: false, slug: folder.name };
  }
};

export const dynamic = "force-dynamic";
