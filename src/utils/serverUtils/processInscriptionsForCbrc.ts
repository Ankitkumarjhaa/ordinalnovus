"use server";

import { checkCbrcValidity } from "@/app/api/v2/search/inscription/route";
import { getCache, setCache } from "@/lib/cache";
import { Inscription, SatCollection } from "@/models";
import { ICollection, IInscription } from "@/types";

export async function processInscriptionsForCbrc(
  inscriptions: IInscription[],
  collection: ICollection | null = null
) {
  let satList: number[] = [];

  if (collection) {
    try {
      const cacheKey = `satList:${collection.slug}`;
      const cachedSatList = await getCache(cacheKey);
      if (cachedSatList) {
        satList = cachedSatList;
      } else {
        const satListInfo = await SatCollection.find({
          official_collection: collection._id,
        })
          .select("sat")
          .lean();
        satList = satListInfo.map((item) => item.sat);
        await setCache(cacheKey, satList, 3600);
      }
    } catch (error) {
      console.error("Error processing collection:", collection.slug, error);
    }
  }

  const inscriptionPromises = inscriptions.map(async (ins: IInscription) => {
    if (ins?.parsed_metaprotocol && ins.valid !== false) {
      if (
        ins.parsed_metaprotocol.includes("cbrc-20") &&
        ins.parsed_metaprotocol.includes("transfer")
      ) {
        await processInscription(ins, satList, collection);
      }
    }

    if (ins.sat) {
      await enrichInscriptionWithReinscriptions(ins);
      if (collection && collection.metaprotocol === "cbrc") {
        await enrichInscriptionWithSatCollection(ins);
      }
    }
  });

  await Promise.all(inscriptionPromises);
  return inscriptions;
}

async function processInscription(
  ins: IInscription,
  satList: number[],
  collection: ICollection | null
) {
  try {
    const cacheKey = `cbrcValidityCheck:${ins.inscription_id}`;
    const validCacheExists = await getCache(cacheKey);

    let valid = null; // true | false | undefined | null
    if (validCacheExists === true || validCacheExists === undefined) {
      console.log("returning validity info from cache...");
      valid = validCacheExists;
      ins.valid = valid;
      ins.cbrc_valid = valid;
      return;
    } else {
      console.log("checking validity from api...");
      valid = await checkCbrcValidity(ins.inscription_id);
    }

    if (valid !== undefined) {
      // Part of CBRC Collection
      if (satList && collection) {
        // If 'satList' exists, check if it includes the 'sat' property of the 'ins' object.
        if (ins.sat && satList.includes(ins.sat)) {
          // If 'satList' contains 'ins.sat', set 'cbrc_valid' property of 'ins' to the value of 'valid'.
          ins.cbrc_valid = valid; // true | false

          // Then, update the inscription in the database using the 'updateInscriptionDB' function.
          // This function presumably updates the 'valid' status of an inscription identified by 'inscription_id'.
          // await updateInscriptionDB(ins.inscription_id, valid);

          // if (valid === true) {
          //   console.log("setting validity cache...");
          //   // await setCache(cacheKey, valid, 120);
          // }
        } else {
          console.log(
            `Marking inscription ${ins.inscription_id} as Invalid because it is inscribed on a sat that does belong to collection: ${collection.slug}`
          );
          // If 'satList' does not contain 'ins.sat', set 'cbrc_valid' property of 'ins' to false.
          ins.cbrc_valid = false;

          // Update the inscription in the database, setting its 'valid' status to false.
          // await updateInscriptionDB(ins.inscription_id, false);
        }
      } else {
        // Just CBRC Token
        ins.cbrc_valid = valid; // true | false

        // Update the inscription in the database with the current 'valid' value.
        // await updateInscriptionDB(ins.inscription_id, valid);

        // if (valid === true) {
        //   console.log("setting validity cache...");
        //   // await setCache(cacheKey, valid, 120);
        // }
      }
    } else {
      console.debug(
        "checkCbrcValidity returned undefined for inscription_id:",
        ins.inscription_id
      );
      // await setCache(cacheKey, valid, 120); // Cache the undefined value to recheck later
    }
  } catch (error) {
    console.error(
      "Error in processInscription for inscription_id:",
      ins.inscription_id,
      error
    );
  }
}

async function enrichInscriptionWithReinscriptions(ins: IInscription) {
  try {
    const reinscriptions = await Inscription.find({ sat: ins.sat })
      .select(
        "inscription_id inscription_number content_type official_collection metaprotocol parsed_metaprotocol sat collection_item_name collection_item_number valid"
      )
      .populate({
        path: "official_collection",
        select: "name slug icon supply _id",
      })
      .lean();
    if (reinscriptions.length > 1) {
      ins.reinscriptions = reinscriptions;
    }
  } catch (error) {
    console.error(
      "Error in enrichInscriptionWithReinscriptions for inscription_id:",
      ins.inscription_id,
      error
    );
  }
}

async function enrichInscriptionWithSatCollection(ins: IInscription) {
  try {
    const satCollection = await SatCollection.findOne({
      sat: ins.sat,
    }).populate({
      path: "official_collection",
      select: "name slug icon supply _id",
    });
    if (satCollection) {
      ins.sat_collection = satCollection;
      ins.official_collection = satCollection.official_collection;
      ins.collection_item_name = satCollection.collection_item_name;
      ins.collection_item_number = satCollection.collection_item_number;
    }
  } catch (error) {
    console.error(
      "Error in enrichInscriptionWithSatCollection for inscription_id:",
      ins.inscription_id,
      error
    );
  }
}
