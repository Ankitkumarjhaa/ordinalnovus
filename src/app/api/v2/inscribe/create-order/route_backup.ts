// app/api/v2/inscribe/create-order/route.ts
import { CustomError } from "@/utils";
import { NextRequest, NextResponse } from "next/server";

import {
  addressReceivedMoneyInThisTx,
  bytesToHex,
  generateRandomHex,
  getBitcoinPrice,
  getMaxFeeRate,
  getMinFeeRate,
  hexToBytes,
  loopTilAddressReceivesMoney,
  pushBTCpmt,
  satsToDollars,
  textToHex,
} from "@/utils/Inscribe";
import mime from "mime-types";

import * as cryptoUtils from "@cmdcode/crypto-utils";

import { Tap, Script, Signer, Tx, Address } from "@cmdcode/tapscript";
import { IFile, IInscribe } from "@/types";
import { Inscribe } from "@/models";
import dbConnect from "@/lib/dbConnect";

export async function POST(req: NextRequest) {
  const { files, lowPostage, receiveAddress, fee } = await req.json();

  const network = process.env.NEXT_PUBLIC_NETWORK || "testnet";

  let privkey =
    "50ed0d28b230d2780aad3af84645822fa91b1eaccded5b597ee061e852e77ab7" ||
    bytesToHex(cryptoUtils.Noble.utils.randomPrivateKey());
  // Validate the input
  if (!files || !Array.isArray(files)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  if (!receiveAddress || !fee) {
    return NextResponse.json(
      { error: "Fee or address missing" },
      { status: 400 }
    );
  }

  try {
    const fileInfoPromises = files.map(async (f, index) => {
      const { file, dataURL } = f;
      const { type, size, name } = file;
      if (size > 3 * 1024 * 1024) {
        throw new Error(`File at index ${index} exceeds the 3MB size limit`);
      }

      const base64_data = dataURL.split(",")[1];

      return {
        base64_data,
        file_type: type.includes("text")
          ? mime.contentType(name)
          : mime.lookup(name),
        file_size: size,
        file_name: name,
        txid: "",
        inscription_fee: 0,
      };
    });

    const fileInfoArray: IFile[] = await Promise.all(fileInfoPromises);

    // create keys
    const KeyPair = cryptoUtils.KeyPair;
    const seckey = new KeyPair(privkey);
    const pubkey = seckey.pub.rawX;

    // Generate Funding Address
    const funding_script = [pubkey, "OP_CHECKSIG"];
    const funding_leaf = Tap.tree.getLeaf(Script.encode(funding_script));
    const [tapkey, cblock] = Tap.getPubKey(pubkey, { target: funding_leaf });
    console.log("Funding Tapkey:", tapkey);
    var funding_address = Address.p2tr.encode(tapkey, network);
    console.log("Funding address: ", funding_address);

    // create encoder
    const ec = new TextEncoder();

    let base_size = 160;

    // total fee
    let total_fee = 0;

    // inscriptions
    let inscriptions: any = [];
    let padding = 1000;

    fileInfoArray.map((file: any) => {
      const mimetype = ec.encode(file.file_type);
      const data = Buffer.from(file.base64_data, "base64");
      const script = [
        pubkey,
        "OP_CHECKSIG",
        "OP_0",
        "OP_IF",
        ec.encode("ord"),
        "01",
        mimetype,
        "OP_0",
        data,
        "OP_ENDIF",
      ];
      const leaf = Tap.tree.getLeaf(Script.encode(script));
      const [tapkey, cblock] = Tap.getPubKey(pubkey, { target: leaf });

      let inscriptionAddress = Address.p2tr.encode(tapkey, network);

      console.log("Inscription address: ", inscriptionAddress);
      console.log("Tapkey:", tapkey);

      let prefix = 160;
      prefix = fee > 1 ? 546 : 700;

      let txsize = prefix + Math.floor(data.length / 4);

      console.log("TXSIZE", txsize);
      let inscription_fee = fee * txsize;
      file.inscription_fee = inscription_fee;
      total_fee += inscription_fee;

      inscriptions.push({
        file_type: file.file_type,
        file_name: file.file_name,
        file_size: file.file_size,
        base64_data: file.base64_data,
        inscription_fee,
        leaf: leaf,
        tapkey: tapkey,
        cblock: cblock,
        inscriptionAddress: inscriptionAddress,
        txsize: txsize,
        fee: fee,
        script: script,
      });
    });

    for (let i = 0; i < inscriptions.length; i++) {
      inscribe(inscriptions[i], i);
    }
    let total_fees =
      total_fee +
      (69 + (inscriptions.length + 1) * 2 * 31 + 10) * fee +
      base_size * inscriptions.length +
      padding * inscriptions.length;

    const data = {
      funding_address,
      privkey,
      receive_address: receiveAddress,
      chain_fee: total_fee,
      service_fee: 0,
      files: inscriptions,
      status: "payment pending",
    };

    await dbConnect();
    await Inscribe.create(data);

    return NextResponse.json({
      inscriptions,
      total_fees,
      funding_address,
      fileInfoArray,
    });
  } catch (error: any) {
    if (!error?.status) console.error("Catch Error: ", error);
    return NextResponse.json(
      { message: error.message || error || "Error creating inscribe order" },
      { status: error.status || 500 }
    );
  }
}

async function inscribe(inscription, i) {}
