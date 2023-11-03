// app/api/v2/inscribe/create-order/route.ts
import { CustomError, wait } from "@/utils";
import { NextRequest, NextResponse } from "next/server";

import {
  addressReceivedMoneyInThisTx,
  loopTilAddressReceivesMoney,
  pushBTCpmt,
} from "@/utils/Inscribe";
import * as cryptoUtils from "@cmdcode/crypto-utils";
import { Tap, Script, Signer, Tx, Address, Word } from "@cmdcode/tapscript";
import { IFile, IInscribe } from "@/types";
import { Inscribe } from "@/models";
import dbConnect from "@/lib/dbConnect";

export async function GET(req: NextRequest) {
  const network = process.env.NEXT_PUBLIC_NETWORK || "testnet";

  try {
    await dbConnect();
    const order = await Inscribe.findOne({ status: "payment received" }).limit(
      1
    );
    if (!order) {
      return NextResponse.json({
        message: "No Pending Orders Have received Payment",
      });
    }
    // create keys
    const KeyPair = cryptoUtils.KeyPair;
    const seckey = new KeyPair(order.privkey);
    const pubkey = seckey.pub.rawX;

    // Generate Funding Address
    const funding_script = [pubkey, "OP_CHECKSIG"];
    const funding_leaf = Tap.tree.getLeaf(Script.encode(funding_script));
    const [tapkey, cblock] = Tap.getPubKey(pubkey, { target: funding_leaf });
    console.log("Funding Tapkey:", tapkey);
    var funding_address = Address.p2tr.encode(tapkey, network);
    console.log("Funding address: ", funding_address);

    // work with inscriptions
    const inscriptions = order.files;
    // console.log(inscriptions, "ins");
    // create encoder
    let txinfo: any = await addressReceivedMoneyInThisTx(
      funding_address,
      process.env.NETWORK || "testnet"
    );
    console.log(txinfo, "TXINFO");

    let txid = txinfo[0];
    let vout = txinfo[1];
    let amt = txinfo[2];

    const inscription_vouts: { value: any; scriptPubKey: Word[] }[] = [];
    inscriptions.map((inscription: any) => {
      inscription_vouts.push({
        value: 1000 + inscription.inscription_fee,
        scriptPubKey: [
          "OP_1",
          Address.toScriptPubKey(inscription.inscription_address)[1],
        ],
      });
    });

    if (!order.txid) {
      const redeemtx = Tx.create({
        vin: [
          {
            txid: txid,
            vout: vout,
            prevout: { value: amt, scriptPubKey: ["OP_1", tapkey] },
            witness: [],
          },
        ],
        vout: inscription_vouts,
      });
      const sig = Signer.taproot.sign(seckey.raw, redeemtx, 0, {
        extension: funding_leaf,
      });
      console.log("signed");
      redeemtx.vin[0].witness = [sig, funding_script, cblock];
      var rawtx = Tx.encode(redeemtx).hex;
      var funding_txid = await pushBTCpmt(rawtx, network);
      // Assuming funding_txid is obtained and stored in the variable funding_txid
      order.txid = funding_txid;
      await order.save();
    }
    console.log("Funds distributed to inscription Addressess");

    const ec = new TextEncoder();

    const txs: any[] = [];
    const txids: string[] = [];

    if (order.txid || funding_txid)
      await Promise.all(
        inscriptions.map(async (inscription: any, idx: number) => {
          const receive_address =
            network === "mainnet"
              ? order.receive_address
              : "tb1pa66udpfheuauxdp22zsm00m5f3edgjuwfzk53rpdhqan4q94uszs3gnkjp";

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
          if (!order.txid) await wait();
          // await loopTilAddressReceivesMoney(
          //   inscription.inscription_address,
          //   network
          // );
          let txinfo: any = await addressReceivedMoneyInThisTx(
            inscription.inscription_address,
            process.env.NETWORK || "testnet"
          );
          let txid = txinfo[0];
          let vout = txinfo[1];
          let amt = txinfo[2];
          console.dir("FOUND THIS TX ", {
            txinfo,
            idx,
            address: inscription.inscription_address,
          });
          const redeemtx: any = Tx.create({
            vin: [
              {
                txid,
                vout,
                prevout: {
                  value: amt,
                  scriptPubKey: ["OP_1", inscription.tapkey],
                },
              },
            ],
            vout: [
              {
                value: amt - inscription.inscription_fee,
                scriptPubKey: [
                  "OP_1",
                  Address.toScriptPubKey(receive_address)[1],
                ],
              },
            ],
          });
          console.dir(redeemtx, { depth: null });
          const sig = Signer.taproot.sign(seckey.raw, redeemtx, 0, {
            extension: inscription.leaf,
          });
          console.log("signed: ", idx);
          redeemtx.vin[0].witness = [sig, script, inscription.cblock];
          var rawtx = Tx.encode(redeemtx).hex;
          txs.push({ idx: rawtx });

          var txid_inscription = await pushBTCpmt(rawtx, network);
          order.files[idx].txid = txid_inscription;
          txids.push(txid_inscription);
        })
      );
    await order.save();

    return NextResponse.json({
      txs,
      txids,
    });
  } catch (error: any) {
    if (!error?.status) console.error("Catch Error: ", error);
    return NextResponse.json(
      { message: error.message || error || "Error creating inscribe order" },
      { status: error.status || 500 }
    );
  }
}
