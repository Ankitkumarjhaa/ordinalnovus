// app/api/v2/inscribe/balance-checker/route.ts
import { CustomError } from "@/utils";
import { NextRequest, NextResponse } from "next/server";
import { Inscribe } from "@/models";
import dbConnect from "@/lib/dbConnect";
import * as cryptoUtils from "@cmdcode/crypto-utils";
import {
  addressOnceHadMoney,
  addressReceivedMoneyInThisTx,
  pushBTCpmt,
} from "@/utils/Inscribe";
import { Address, Script, Signer, Tap, Tx } from "@cmdcode/tapscript";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const orders = await Inscribe.find({ status: "payment pending" }).limit(
      100
    );
    const funded_addresses: string[] = [];
    const refunded_address: string[] = [];

    await Promise.all(
      orders.map(async (item, i) => {
        const funding_address = item.funding_address;
        const funded = await addressOnceHadMoney(
          funding_address,
          item.network,
          item.chain_fee + item.service_fee
        ).catch(async (err) => {
          if (err.message === "Low Balance") {
            const KeyPair = cryptoUtils.KeyPair;
            const seckey = new KeyPair(item.privkey);
            const pubkey = seckey.pub.rawX;
            const funding_script = [pubkey, "OP_CHECKSIG"];
            const funding_leaf = Tap.tree.getLeaf(
              Script.encode(funding_script)
            );
            const [tapkey, cblock] = Tap.getPubKey(pubkey, {
              target: funding_leaf,
            });
            const txinfo = await addressReceivedMoneyInThisTx(
              item.funding_address,
              item.network
            );

            const [txid, vout, value, input_address, vsize] = txinfo;
            if (
              typeof txid !== "string" ||
              typeof vout !== "number" ||
              typeof value !== "number" ||
              typeof input_address !== "string" ||
              typeof vsize !== "number"
            ) {
              // Handle the case where any of the values are undefined.
              // You could throw an error or perform some other action based on your application's logic.
              throw new Error(
                "Failed to retrieve transaction details from the funding address."
              );
            }
            const fee = vsize * item.fee_rate;

            // Construct the redeem transaction to distribute funds to the inscription outputs.
            const redeemtx = Tx.create({
              vin: [
                {
                  txid,
                  vout,
                  prevout: {
                    value,
                    scriptPubKey: Address.toScriptPubKey(item.funding_address),
                  },
                  witness: [],
                },
              ],
              vout: [
                {
                  value: value - fee,
                  scriptPubKey: Address.toScriptPubKey(input_address),
                },
              ],
            });
            const sig = Signer.taproot.sign(seckey.raw, redeemtx, 0, {
              extension: funding_leaf,
            });
            redeemtx.vin[0].witness = [sig, funding_script, cblock];
            const rawtx = Tx.encode(redeemtx).hex;
            console.log("Creating Refund Tx", rawtx);
            const refund_txid = await pushBTCpmt(rawtx, item.network);
            refunded_address.push(item.funding_address);
            await Inscribe.updateOne(
              { _id: item._id },
              { $set: { status: "refunded", txid: refund_txid } }
            );
          }
        });

        if (funded) {
          // Update the document in the database with the new status
          await Inscribe.updateOne(
            { _id: item._id },
            { $set: { status: "payment received" } }
          );
          funded_addresses.push(funding_address);
        }
      })
    );

    return NextResponse.json({ funded_addresses, refunded_address });
  } catch (error: any) {
    if (!error?.status) console.error("Catch Error: ", error);
    return NextResponse.json(
      { message: error.message || error || "Error creating inscribe order" },
      { status: error.status || 500 }
    );
  }
}
