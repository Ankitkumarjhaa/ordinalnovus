"use server";

import dbConnect from "@/lib/dbConnect";
import { Inscribe, CreateInscription } from "@/models";
import * as bitcoin from "bitcoinjs-lib";
import secp256k1 from "@bitcoinerlab/secp256k1";

async function updateOrder(order_id: string, signed_psbt: string) {
  if (!order_id || !signed_psbt) {
    throw new Error("Invalid parameters");
  }

  try {
    bitcoin.initEccLib(secp256k1);
    let parsedPsbt = bitcoin.Psbt.fromBase64(signed_psbt);
    for (let i = 0; i < parsedPsbt.data.inputs.length; i++) {
      try {
        parsedPsbt.finalizeInput(i);
      } catch (e) {
        console.error(`Error finalizing input at index ${i}: ${e}`);
      }
    }
    const signed_psbt_hex = parsedPsbt.extractTransaction().toHex();
    const broadcastRes = await fetch(
      `https://mempool-api.ordinalnovus.com/tx`,
      {
        method: "post",
        body: signed_psbt_hex,
      }
    );

    if (broadcastRes.status != 200) {
      throw Error(
        "error broadcasting tx " +
          broadcastRes.statusText +
          "\n\n" +
          (await broadcastRes.text())
      );
    }
    const txid = await broadcastRes.text();
    await dbConnect();

    const result = await Inscribe.updateOne(
      { order_id },
      {
        $set: {
          txid,
          status: "payment received",
        },
      }
    );

    const result_2 = await CreateInscription.updateOne(
      { order_id },
      {
        $set: {
          txid,
          status: "payment received",
        },
      }
    );

    if (result.modifiedCount === 0 || result_2.modifiedCount === 0) {
      throw new Error("No order found");
    }

    return { success: true, message: "Order updated successfully", txid };
  } catch (err: any) {
    console.error("Error updating order status:", err);
    throw Error(err.message || err);
    return { success: false, message: err.message };
  }
}

export default updateOrder;
