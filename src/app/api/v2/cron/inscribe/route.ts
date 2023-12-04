// app/api/v2/cron/inscribe/route.ts
import { CustomError, wait } from "@/utils";
import { addressReceivedMoneyInThisTx, pushBTCpmt } from "@/utils/Inscribe";
import { NextRequest, NextResponse } from "next/server";
import * as cryptoUtils from "@cmdcode/crypto-utils";
import { Tap, Script, Signer, Tx, Address } from "@cmdcode/tapscript";
import { IFileSchema, IInscribeOrder } from "@/types";
import { Inscribe } from "@/models";
import dbConnect from "@/lib/dbConnect";

/**
 * Finds an order with the status "payment received" from the database.
 * @returns {Promise<IInscribeOrder | null>} A promise that resolves to the found order or null if not found.
 */
async function findOrder() {
  await dbConnect();
  return Inscribe.findOne({ status: "payment received" }).limit(1);
}

/**
 * Creates a funding address for the given order.
 * @param {IInscribeOrder} order - The order for which to create the funding address.
 * @returns {Object} An object containing funding address components.
 */
function createFundingAddress(order: IInscribeOrder) {
  const KeyPair = cryptoUtils.KeyPair;
  const seckey = new KeyPair(order.privkey);
  const pubkey = seckey.pub.rawX;
  const funding_script = [pubkey, "OP_CHECKSIG"];
  const funding_leaf = Tap.tree.getLeaf(Script.encode(funding_script));
  const [tapkey, cblock] = Tap.getPubKey(pubkey, { target: funding_leaf });
  //@ts-ignore
  const funding_address = Address.p2tr.encode(tapkey, order.network);
  return {
    funding_address,
    pubkey,
    seckey,
    funding_leaf,
    tapkey,
    cblock,
    funding_script,
  };
}

/**
 * Generates inscription vouts for a given set of inscriptions.
 * @param {IFileSchema[]} inscriptions - An array of inscriptions.
 * @param {Uint8Array} pubkey - The public key associated with the inscriptions.
 * @returns {Promise<Object[]>} A promise that resolves to an array of inscription vouts.
 */
async function generateInscriptionVouts(
  inscriptions: IFileSchema[],
  pubkey: Uint8Array
) {
  const inscription_vouts: { value: number; scriptPubKey: string[] }[] = [];
  for (const inscription of inscriptions) {
    inscription_vouts.push({
      value: 1000 + inscription.inscription_fee,
      //@ts-ignore
      scriptPubKey: Address.toScriptPubKey(inscription.inscription_address),
    });
  }

  return inscription_vouts;
}
/**
 * Constructs output transactions (vouts) for the service and referral fees associated with an order.
 * Each vout includes the fee amount and the corresponding scriptPubKey based on the network type.
 * If service fees are applicable, a vout for the service fee is generated using a predefined address.
 * If referral fees are applicable, a vout for the referral fee is generated using the referrer's address.
 *
 * Note: TypeScript ignores are utilized to bypass type checks on the dynamically generated scriptPubKeys.
 *
 * @param {IInscribeOrder} order - The order containing service and referral fee information.
 * @returns {Promise<{ value: number; scriptPubKey: string[] }[]>} - A promise that resolves to an array of fee vouts.
 */
async function generateFeesVouts(
  order: IInscribeOrder
): Promise<{ value: number; scriptPubKey: string[] }[]> {
  const fee_vouts: { value: number; scriptPubKey: string[] }[] = [];
  if (order.service_fee) {
    fee_vouts.push({
      value: order.service_fee,
      //@ts-ignore
      scriptPubKey: Address.toScriptPubKey(
        order.network == "testnet"
          ? "tb1qqx9d3ua62lph9tdn473rru2fehw5sz7538yw3d"
          : "bc1qhg8828sk4yq6ac08rxd0rh7dzfjvgdch3vfsm4"
      ),
    });
  }
  if (order.referral_fee) {
    fee_vouts.push({
      value: order.referral_fee,
      //@ts-ignore
      scriptPubKey: Address.toScriptPubKey(order.referrer),
    });
  }

  return fee_vouts;
}

/**
 * Processes inscriptions for a given order.
 * @param {IInscribeOrder} order - The order containing the inscriptions.
 * @param {IFileSchema[]} inscriptions - An array of inscriptions.
 * @param {cryptoUtils.KeyPair} seckey - The secret key associated with the order.
 * @param {Uint8Array} pubkey - The public key associated with the inscriptions.
 * @returns {Promise<Object>} A promise that resolves to an object containing transaction details.
 */
async function processInscriptions(
  order: IInscribeOrder,
  inscriptions: IFileSchema[],
  seckey: cryptoUtils.KeyPair,
  pubkey: Uint8Array
) {
  const txs: any[] = [];
  const txids: string[] = [];
  const ec = new TextEncoder();

  for (const [idx, inscription] of inscriptions.entries()) {
    const txinfo = await addressReceivedMoneyInThisTx(
      inscription.inscription_address,
      order.network
    );
    const [txid, vout, value] = txinfo;
    if (
      typeof txid !== "string" ||
      typeof vout !== "number" ||
      typeof value !== "number"
    ) {
      // Handle the case where any of the values are undefined.
      // You could throw an error or perform some other action based on your application's logic.
      throw new Error(
        "Failed to retrieve transaction details from the funding address."
      );
    }
    const data = Buffer.from(inscription.base64_data, "base64");
    const script = [
      pubkey,
      "OP_CHECKSIG",
      "OP_0",
      "OP_IF",
      ec.encode("ord"),
      "01",
      ec.encode(inscription.file_type),
      "OP_0",
      data,
      "OP_ENDIF",
    ];
    const redeemtx = Tx.create({
      vin: [
        {
          txid,
          vout,
          prevout: {
            value,
            scriptPubKey: Address.toScriptPubKey(
              inscription.inscription_address
            ),
          },
          witness: [],
        },
      ],
      vout: [
        {
          value: value - inscription.inscription_fee,
          scriptPubKey: Address.toScriptPubKey(order.receive_address),
        },
      ],
    });
    const sig = Signer.taproot.sign(seckey.raw, redeemtx, 0, {
      extension: inscription.leaf,
    });
    redeemtx.vin[0].witness = [sig, script, inscription.cblock];
    const rawtx = Tx.encode(redeemtx).hex;
    txs.push({ idx: rawtx });
    const txid_inscription = await pushBTCpmt(rawtx, order.network);
    order.inscriptions[idx].txid = txid_inscription;
    order.inscriptions[idx].inscription_id = txid_inscription + "i" + "0";
    txids.push(txid_inscription);
  }
  order.status = "inscribed";
  await order.save();
  return { txs, txids };
}

/**
 * Attempts to fund a given order by distributing the necessary funds from the funding address
 * to each of the inscription outputs. If the order already has a transaction ID associated
 * with it, indicating that the funding step has already been completed, this function will
 * skip the funding process.
 *
 * @param order - The order that needs to be funded.
 * @param seckey - The secret key pair used for signing the transaction.
 * @param funding_leaf - The leaf used in the Taproot funding structure.
 * @param tapkey - The taproot public key.
 * @param cblock - Control block for the taproot script path spend.
 * @param funding_script - The script used for the funding address.
 * @param inscription_vouts - An array of transaction outputs for the inscription process.
 * @param network - The Bitcoin network on which the transaction should be broadcasted.
 * @returns A promise that resolves to the funding transaction ID if successful, or null if skipped.
 * @throws Will throw an error if the transaction creation or broadcasting fails.
 */
async function processFunding(
  order: IInscribeOrder,
  seckey: cryptoUtils.KeyPair,
  funding_leaf: string,
  tapkey: string,
  cblock: string,
  funding_script: (string | Uint8Array)[],
  inscription_vouts: { value: number; scriptPubKey: string[] }[],
  network: string
): Promise<string | null> {
  // Check if the order has already been processed.
  if (order.txid) {
    return null;
  }

  // Fetch transaction details where the funding address has received money.
  const [txid, vout, value] = await addressReceivedMoneyInThisTx(
    order.funding_address,
    order.network
  );

  if (
    typeof txid !== "string" ||
    typeof vout !== "number" ||
    typeof value !== "number"
  ) {
    // Handle the case where any of the values are undefined.
    // You could throw an error or perform some other action based on your application's logic.
    throw new Error(
      "Failed to retrieve transaction details from the funding address."
    );
  }

  // Construct the redeem transaction to distribute funds to the inscription outputs.
  const redeemtx = Tx.create({
    vin: [
      {
        txid,
        vout,
        prevout: {
          value,
          scriptPubKey: Address.toScriptPubKey(order.funding_address),
        },
        witness: [],
      },
    ],
    vout: inscription_vouts,
  });

  // Sign the transaction using the secret key and the appropriate Taproot structures.
  const sig = Signer.taproot.sign(seckey.raw, redeemtx, 0, {
    extension: funding_leaf,
  });
  redeemtx.vin[0].witness = [sig, funding_script, cblock];

  // Encode and broadcast the raw transaction to the network.
  const rawtx = Tx.encode(redeemtx).hex;
  console.debug("Signed Raw Transaction:", rawtx);

  // This function call should broadcast the transaction and return the transaction ID.
  const funding_txid = await pushBTCpmt(rawtx, network);
  order.txid = funding_txid;
  await order.save();

  // Return the funding transaction ID.
  return funding_txid;
}

/**
 * GET handler for the inscribe route.
 * Processes the payment and creates transactions for the inscriptions.
 * @param {NextRequest} req - The incoming request object.
 * @returns {NextResponse} A Next.js response object with the transaction details or an error message.
 */
export async function GET(req: NextRequest) {
  try {
    const order = await findOrder();
    if (!order) {
      return NextResponse.json({
        message: "No Pending Orders Have received Payment",
      });
    }

    const { pubkey, seckey, funding_leaf, tapkey, cblock, funding_script } =
      createFundingAddress(order);

    const inscription_vouts = await generateInscriptionVouts(
      order.inscriptions,
      pubkey
    );

    const fee_vouts = await generateFeesVouts(order);

    // Process funding
    const fundingTxId = await processFunding(
      order,
      seckey,
      funding_leaf,
      tapkey,
      cblock,
      funding_script,
      [...inscription_vouts, ...fee_vouts],
      order.network
    );

    if (fundingTxId) await wait();

    const { txs, txids } = await processInscriptions(
      order,
      order.inscriptions,
      seckey,
      pubkey
    );

    return NextResponse.json({ txs, txids });
  } catch (error: any) {
    console.error("Catch Error: ", error);
    return NextResponse.json(
      { message: error.message || "Error creating inscribe order" },
      { status: 500 }
    );
  }
}
