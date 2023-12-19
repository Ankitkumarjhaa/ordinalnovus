import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import dbConnect from "@/lib/dbConnect";
import { Tx, Sale, Inscription } from "@/models";
import { IVIN, IVOUT } from "@/types/Tx";
import { ITXDATA, constructTxData } from "@/utils/api/constructTxData";
import { IInscription } from "@/types";
import discordWebhookCBRCSaleAlert from "@/utils/discord_webhook";

interface IInscriptionDetails {
  inscription_id: string;
  body: {
    location: string;
    offset: number;
    address: string;
    output: string;
    output_value: number;
    listed: boolean;
    listed_at: Date;
    listed_price: number;
    listed_maker_fee_bp: number;
    tap_internal_key: string;
    listed_seller_receive_address: string;
    signed_psbt: string;
    unsigned_psbt: string;
  };
}

async function fetchInscriptionsFromOutput(
  output: string,
  vin: IVIN[],
  vout: IVOUT[]
): Promise<IInscriptionDetails[]> {
  try {
    const apiUrl = `${process.env.NEXT_PUBLIC_PROVIDER}/api/output/${output}`;
    const { data } = await axios.get(apiUrl);
    if (!data.inscription_details?.length) {
      return [];
    }
    const details = data.inscription_details.map((i: any) => ({
      inscription_id: i.inscription_id,
      txData: constructTxData(i.inscription_id, vin, vout),
      body: {
        location: i.location,
        offset: Number(i.offset),
        address: data.address,
        output: i.output,
        output_value: Number(i.output_value.value),
        listed: false,
        listed_at: new Date(),
        listed_price: 0,
        listed_maker_fee_bp: 0,
        tap_internal_key: "",
        listed_seller_receive_address: "",
        signed_psbt: "",
        unsigned_psbt: "",
        in_mempool: false,
        txid: i.location.split(":")[0],
        ...(i.metaprotocol && { metaprotocol: i.metaprotocol }),
      },
    }));

    return details;
  } catch (error) {
    console.error(`Error fetching inscriptions for output ${output}:`, error);
    throw new Error("Failed to fetch inscriptions");
  }
}

const LIMIT = 200;
async function parseTxData(sort: 1 | -1, skip: number) {
  try {
    const modifiedTxIds: string[] = [];
    const modifiedInscriptionIds: string[] = [];
    const nonParsedTxs = await Tx.find({ parsed: false })
      .limit(LIMIT)
      .sort({ createdAt: sort })
      .skip(skip);

    const txBulkOps = [];
    const inscriptionBulkOps: any = [];
    const salesBulkOps: any = [];

    if (!nonParsedTxs.length) {
      return {
        message: "No Transactions left to parse",
      };
    }

    console.debug(
      `Parsing ${nonParsedTxs.length} Transactions. starting: ${nonParsedTxs[0].txid}`
    );

    for (const tx of nonParsedTxs) {
      const { txid, vout, vin, _id } = tx;
      modifiedTxIds.push(txid);
      let inscriptionIds: string[] = [];
      let isInscribed = false;

      const outputPromises = vout.map(async (v: IVOUT, index: number) => {
        if (index < 10) {
          return fetchInscriptionsFromOutput(
            `${txid}:${index}`,
            tx.vin,
            tx.vout
          );
        }
        return [];
      });

      const inscriptions = (await Promise.all(outputPromises)).flat();
      isInscribed = inscriptions.some((i) => i.inscription_id.startsWith(txid));

      inscriptionIds = inscriptions.map((i) => {
        modifiedInscriptionIds.push(i.inscription_id);

        return i.inscription_id;
      });

      inscriptions.forEach((i) => {
        inscriptionBulkOps.push({
          updateOne: {
            filter: { inscription_id: i.inscription_id },
            update: { $set: i.body },
          },
        });
      });

      let txData: ITXDATA | null =
        inscriptions && inscriptions.length ? inscriptions[0].txData : null;

      let metaprotocol =
        inscriptions && inscriptions.length
          ? inscriptions[0].body.metaprotocol
          : null;

      let cbrcInfo = null;
      if (
        metaprotocol &&
        metaprotocol.includes("cbrc-20") &&
        metaprotocol.includes("=") &&
        txData &&
        txData.price
      ) {
        const [_, __, tokenAmt] = metaprotocol.split(":");
        const [token, amt] = tokenAmt.split("=");

        cbrcInfo = {
          metaprotocol: "cbrc-20",
          token: token.trim().toLowerCase(),
          amount: Number(amt),
          price_per_token: txData.price / Number(amt),
        };
      }

      txBulkOps.push({
        updateOne: {
          filter: { _id },
          update: {
            $set: {
              ...(cbrcInfo && {
                metaprotocol: cbrcInfo?.metaprotocol,
                token: cbrcInfo?.token,
                amount: cbrcInfo?.amount,
                price_per_token: cbrcInfo?.price_per_token,
              }),
              txid,
              ...(inscriptionIds.length && {
                inscriptions: inscriptionIds,
              }),
              ...(inscriptionIds.length > 0
                ? {
                    tag: isInscribed
                      ? "inscribed"
                      : txData && (txData as ITXDATA) && txData.tag
                      ? txData.tag
                      : "others",
                  }
                : {}),
              parsed: true,
              ...(txData && { from: txData.from }),
              ...(txData && { to: txData.to }),
              ...(txData && { price: txData.price }),
              ...(txData && { marketplace: txData.marketplace }),
              ...(metaprotocol && { parsed_metaprotocol: metaprotocol }),
            },
          },
        },
      });

      if (
        txData &&
        txData.tag === "sale" &&
        txData.marketplace === "ordinalnovus"
      ) {
        const inscription_id = inscriptionIds[0];
        const result = await Inscription.findOne({
          inscription_id,
        }).populate("official_collection");

        const inscription: IInscription | null = Array.isArray(result)
          ? result[0]
          : result;

        if (inscription) {
          salesBulkOps.push({
            insertOne: {
              document: {
                inscription: inscription._id,
                inscription_id,
                output_value: inscription.output_value,
                location: inscription.location,

                sale_date: tx.timestamp,
                fee: tx.fee,
                price: txData.price || 0,
                from: txData.from || "", // seller_ordinal_address
                seller_receive_address:
                  inscription.listed_seller_receive_address, // seller_payment_addres
                to: txData.to || "", // buyer_ordinal_address,
                txid: tx.txid,
                marketplace_fee: txData.fee || 0,
                ...(metaprotocol && { parsed_metaprotocol: metaprotocol }),
              },
            },
          });
        }
      }
    }

    if (txBulkOps.length > 0 && inscriptionBulkOps.length > 0) {
      await discordWebhookCBRCSaleAlert(txBulkOps);
    }
    if (txBulkOps.length > 0) {
      await Tx.bulkWrite(txBulkOps);
    }

    if (salesBulkOps.length > 0) {
      await Sale.bulkWrite(salesBulkOps);
    }

    if (inscriptionBulkOps.length > 0) {
      await Inscription.bulkWrite(inscriptionBulkOps);
    }

    return {
      modifiedTxIds: modifiedTxIds.length,
      modifiedInscriptionIds: modifiedInscriptionIds.length,
      salesBulkOps: salesBulkOps.length,
      inscriptionBulkOps: inscriptionBulkOps.length,
      txBulkOps: txBulkOps.length,
    };
  } catch (error) {
    console.error("Error in parsing transactions:", error);
  }
}
// API Handler
export async function GET(req: NextRequest, res: NextResponse) {
  try {
    console.log(`***** Parse Txs Heaviest[CRONJOB] Called *****`);
    await dbConnect();
    const nonParsedTxs = await Tx.countDocuments({ parsed: false });
    if (nonParsedTxs < 7000)
      return NextResponse.json({ message: "Not enough Txs" });

    const MAX_CALLS = 4;

    const numberOfCalls = Math.min(
      Math.ceil((nonParsedTxs - 7000) / LIMIT),
      MAX_CALLS
    );

    const results = [];
    for (let i = 0; i < numberOfCalls; i++) {
      let offset = i * LIMIT; // Adjust offset to fetch distinct batches

      console.log({ offset: offset + 7000 });

      results.push(parseTxData(1, offset + 7000));
    }
    const result = await Promise.allSettled(results);

    return NextResponse.json({
      message: "Processing completed, check logs for details",
      InscriptionData: result,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error fetching and saving txids" },
      { status: 500 }
    );
  }
}

async function resetParsedAndRemoveFields() {
  try {
    await dbConnect();
    const updateQuery = {
      $set: { parsed: false },
      $unset: {
        inscriptions: "",
        from: "",
        to: "",
        marketplace: "",
        price: "",
        tag: "",
      },
    };
    const updateOptions = { multi: true };
    const result: any = await Tx.updateMany({}, updateQuery, updateOptions);
    console.debug(`${result.nModified} documents were updated.`);
  } catch (error) {
    console.error(
      "Error in resetting parsed field and removing specific fields:",
      error
    );
  }
}

export const dynamic = "force-dynamic";
