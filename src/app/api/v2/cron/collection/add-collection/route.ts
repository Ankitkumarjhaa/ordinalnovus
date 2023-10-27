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
    const collectionsEntries = data.data.repository.object.entries;
    console.log(collectionsEntries.length, "CE");
    const collectionsFolders = collectionsEntries
      .filter((item: { type: string }) => item.type === "tree")
      .filter((item: { name: any }) => !existingSlugs.includes(item.name));

    console.log(collectionsFolders.length, "TOTAL COLLECTIONS TO PROCESS");

    try {
      const batchLimit = 100;
      const processItems = collectionsFolders.slice(0, batchLimit);
      console.log(processItems.length, " Procesing items");

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
  try {
    const metaResponse = await fetch(
      `https://raw.githubusercontent.com/ordinals-wallet/ordinals-collections/main/collections/${folder.name}/meta.json`
    );

    if (!metaResponse.ok) {
      throw new Error("Failed to fetch meta data");
    }
    console.log("fetching metadata...");

    const metaData = await metaResponse.json();
    // console.log("got metadata for ", folder.name, { metaData });
    // console.log({
    //   metaData: metaData,
    //   icon: metaData.inscription_icon || metaData.icon,
    // });
    console.log("processing...");
    if (metaData.twitter_link && !validateUrl(metaData.twitter_link)) {
      console.log("invalid_twitter link");
      metaData.twitter_link = "";
      //  saveFailedCollection(folder.name);
      // return;
    }
    if (metaData.discord_link && !validateUrl(metaData.discord_link)) {
      console.log("invalid discord_link");
      metaData.discord_link = "";
      //  saveFailedCollection(folder.name);
      // return;
    }

    if (metaData.website_link && !validateUrl(metaData.website_link)) {
      console.log("invalid website link");
      metaData.website_link = "";
      //  saveFailedCollection(folder.name);
      // return;
    }
    if (!validateSlug(metaData.slug)) {
      metaData.error = true;
      metaData.error_tag = "Slug invalid";
    }

    metaData.live = true;
    metaData.type = "official";
    metaData.updatedBy = "cronjob";
    metaData.supply = 0;

    if (!metaData.description) {
      metaData.description = `${metaData.name} is a collection forever inscribed on the BTC Blockchain.`;
    }

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
        metaData.error_tag = "inscription icon not in db";
        console.log(
          "adding to err file because inscription_icon wasn't found in db: ",
          folder.name
        );
      }
    } else {
      metaData.inscription_icon = null;
    }
    console.log(metaData, "adding...");

    const newCollection = new Collection(metaData);
    await newCollection.save();
    return { success: true, slug: folder.name };
  } catch (error) {
    console.error("Error processing collection:", error);
    return { success: false, slug: folder.name };
  }
};

export const dynamic = "force-dynamic";
