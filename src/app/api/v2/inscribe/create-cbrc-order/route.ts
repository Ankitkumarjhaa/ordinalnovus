// app/api/v2/inscribe/create-cbrc-order/route.ts
import { NextRequest, NextResponse } from "next/server";
//@ts-ignore
import mime from "mime-types";
import { v4 as uuidv4 } from "uuid";
import * as cryptoUtils from "@cmdcode/crypto-utils";
import { Tap, Script, Address } from "@cmdcode/tapscript";
import { IFileSchema, IInscribeOrder } from "@/types";
import { Inscribe } from "@/models";
import dbConnect from "@/lib/dbConnect";
import { CustomError } from "@/utils";
import { bytesToHex, satsToDollars } from "@/utils/Inscribe";

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
const BASE_SIZE = 160;
const PADDING = 1000;
const PREFIX = 546;
const MINIMUM_FEE = 1000;

export async function POST(req: NextRequest) {
  try {
    let {
      files,
      tick,
      network = "mainnet",
      receive_address,
      fee_rate,
      webhook_url,
      referrer,
      referral_fee,
      referral_fee_percent,
      amt,
      content,
      op,
    } = await req.json();

    if (!tick || !amt || isNaN(Number(amt)) || !op) {
      throw new CustomError("Invalid input", 400);
    }

    if (referrer && !referral_fee && !referral_fee_percent) {
      throw new CustomError(
        "Referral address has been used. Please provide referral_fee.",
        400
      );
    }

    if (!receive_address || !fee_rate) {
      throw new CustomError("Fee or address missing", 400);
    }

    let fileInfoArray = await processFiles(files);
    const privkey = generatePrivateKey();
    const { funding_address, pubkey } = generateFundingAddress(
      privkey,
      network
    );

    const inscriptions = processInscriptions(
      fileInfoArray,
      pubkey,
      network,
      fee_rate,
      tick,
      Number(amt),
      op,
      content
    );

    let total_fees = calculateTotalFees(inscriptions, fee_rate);
    if (referrer)
      referral_fee = calculateReferralFee(
        total_fees,
        referral_fee,
        referral_fee_percent
      );
    else referral_fee = 0;
    let service_fee = calculateServiceFee(total_fees, referral_fee);

    const data = constructOrderData(
      uuidv4(),
      funding_address,
      privkey,
      receive_address,
      total_fees,
      service_fee,
      referrer,
      referral_fee,
      fee_rate,
      inscriptions,
      network,
      false,
      webhook_url
    );

    await dbConnect();
    await Inscribe.create(data);

    clearInscriptionData(inscriptions);
    const final_response = await constructResponse(
      inscriptions,
      total_fees,
      service_fee,
      referral_fee,
      funding_address
    );

    return NextResponse.json(final_response);
  } catch (error: any) {
    console.error("Catch Error: ", error);
    const status = error?.status || 500;
    const message = error.message || "Error creating inscribe order";
    return NextResponse.json({ message }, { status });
  }
}

function generatePrivateKey() {
  return bytesToHex(cryptoUtils.Noble.utils.randomPrivateKey());
}

function generateFundingAddress(
  privkey: string,
  network: "testnet" | "mainnet"
) {
  const KeyPair = cryptoUtils.KeyPair;
  const seckey = new KeyPair(privkey);
  const pubkey = seckey.pub.rawX;

  const funding_script = [pubkey, "OP_CHECKSIG"];
  const funding_leaf = Tap.tree.getLeaf(Script.encode(funding_script));
  const [tapkey, cblock] = Tap.getPubKey(pubkey, { target: funding_leaf });
  //@ts-ignore
  var funding_address = Address.p2tr.encode(tapkey, network);

  console.debug("Funding Tapkey:", tapkey);
  console.debug("Funding address: ", funding_address);

  return { funding_address, pubkey };
}

async function processFiles(files: any[]): Promise<IFileSchema[]> {
  const fileInfoPromises = files.map(async (f, index) => {
    const { file, dataURL } = f;
    const { type, size, name } = file;
    if (size > MAX_FILE_SIZE) {
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
      inscription_address: "",
      tapkey: "",
      leaf: "",
      cblock: "",
    };
  });

  return Promise.all(fileInfoPromises);
}

function processInscriptions(
  fileInfoArray: IFileSchema[],
  pubkey: Uint8Array,
  network: "testnet" | "mainnet",
  fee_rate: number,
  tick: string,
  amt: number,
  op: string,
  content?: string
) {
  console.log({ op, content, tick, amt, fee_rate });
  const ec = new TextEncoder();
  let total_fee = 0;
  let inscriptions: any = [];

  fileInfoArray.map((file: any) => {
    const mimetype = file.file_type || "text/plain;charset=utf-8";
    const metaprotocol = `cbrc-20:${op.toLowerCase()}:${tick
      .trim()
      .toLowerCase()}=${amt}`;
    const data = Buffer.from(
      file.base64_data || content || `${amt} ${tick}`,
      "base64"
    );
    console.log({ metaprotocol, mimetype });
    const script = [
      pubkey,
      "OP_CHECKSIG",
      "OP_0",
      "OP_IF",
      ec.encode("ord"),
      "01",
      ec.encode(mimetype),
      "07",
      ec.encode(metaprotocol),
      "OP_0",
      data,
      "OP_ENDIF",
    ];
    const leaf = Tap.tree.getLeaf(Script.encode(script));
    const [tapkey, cblock] = Tap.getPubKey(pubkey, { target: leaf });

    //@ts-ignore
    let inscriptionAddress = Address.p2tr.encode(tapkey, network);

    console.debug("Inscription address: ", inscriptionAddress);
    console.debug("Tapkey:", tapkey);

    console.log(file.file_type);
    let txsize =
      !file.file_type || file.file_type.includes("text")
        ? 400 + Math.floor(data.length / 4)
        : PREFIX + Math.floor(data.length / 4);

    let inscription_fee = fee_rate * txsize;
    file.inscription_fee = inscription_fee;
    total_fee += inscription_fee;

    console.log({ txsize, fee_rate, inscription_fee });

    inscriptions.push({
      ...file,
      leaf: leaf,
      tapkey: tapkey,
      cblock: cblock,
      inscription_address: inscriptionAddress,
      txsize: txsize,
      fee_rate: fee_rate,
    });
  });

  // if (tick && op && amt && fileInfoArray) {
  //   const mimetype = ec.encode(file.file_type||"text/plain;charset=utf-8");
  // const metaprotocol = ec.encode(
  //   `cbrc-20:${op.toLowerCase()}:${tick}=${amt}`
  // );
  // const data = Buffer.from(content || `${amt} ${tick}`, "base64");
  //   const script = [
  //     pubkey,
  //     "OP_CHECKSIG",
  //     "OP_0",
  //     "OP_IF",
  //     ec.encode("ord"),
  //     "01",
  //     mimetype,
  // "07",
  // metaprotocol,
  //     "OP_0",
  //     data,
  //     "OP_ENDIF",
  //   ];
  //   const leaf = Tap.tree.getLeaf(Script.encode(script));
  //   const [tapkey, cblock] = Tap.getPubKey(pubkey, { target: leaf });

  //   //@ts-ignore
  //   let inscriptionAddress = Address.p2tr.encode(tapkey, network);

  //   console.debug("Inscription address: ", inscriptionAddress);
  //   console.debug("Tapkey:", tapkey);

  //   let txsize = PREFIX + Math.floor(data.length / 4);

  //   let file = { inscription_fee: 0 };
  //   let inscription_fee = fee_rate * txsize;
  //   file.inscription_fee = inscription_fee;
  //   total_fee += inscription_fee;

  //   inscriptions.push({
  //     ...file,
  //     leaf: leaf,
  //     tapkey: tapkey,
  //     cblock: cblock,
  //     inscription_address: inscriptionAddress,
  //     txsize: txsize,
  //     fee_rate: fee_rate,
  //   });
  // }

  return inscriptions;
}

function calculateTotalFees(inscriptions: any[], fee_rate: number) {
  let total_fee = inscriptions.reduce(
    (acc, ins) => acc + ins.inscription_fee,
    0
  );
  return (
    total_fee +
    (69 + (inscriptions.length + 1) * 2 * 31 + 10) * fee_rate +
    BASE_SIZE * inscriptions.length +
    PADDING * inscriptions.length
  );
}

function calculateReferralFee(
  total_fees: number,
  referral_fee: number | undefined,
  referral_fee_percent: number | undefined
) {
  referral_fee =
    referral_fee ||
    (referral_fee_percent && total_fees * (referral_fee_percent / 100)) ||
    0;
  if (referral_fee < MINIMUM_FEE) referral_fee = MINIMUM_FEE;

  return referral_fee;
}

function calculateServiceFee(total_fees: number, referral_fee: number) {
  let service_fee = Math.ceil((total_fees + referral_fee) * 0.05);
  if (service_fee < MINIMUM_FEE) service_fee = MINIMUM_FEE;

  return service_fee;
}

function constructOrderData(
  order_id: string,
  funding_address: string,
  privkey: string,
  receive_address: string,
  chain_fee: number,
  service_fee: number,
  referrer: string | undefined,
  referral_fee: number | undefined,
  fee_rate: number,
  inscriptions: any[],
  network: "testnet" | "mainnet",
  cursed: boolean,
  webhook_url: string | undefined
): IInscribeOrder {
  //@ts-ignore
  return {
    order_id: order_id,
    funding_address: funding_address,
    privkey: privkey,
    receive_address: receive_address,
    chain_fee: chain_fee,
    service_fee: service_fee,
    referrer,
    referral_fee: referral_fee,
    fee_rate: fee_rate,
    inscriptions: inscriptions,
    network: network,
    cursed: cursed,
    webhook_url: webhook_url,
    status: "payment pending",
  };
}

function clearInscriptionData(inscriptions: any[]) {
  inscriptions.forEach((inscription: any) => {
    delete inscription.base64_data;
    delete inscription.file_name;
  });
}

async function constructResponse(
  inscriptions: any[],
  total_fees: number,
  service_fee: number,
  referral_fee: number | undefined,
  funding_address: string
) {
  return {
    inscriptions: inscriptions,
    chain_fee: total_fees,
    service_fee: service_fee,
    referral_fee: referral_fee,
    total_fee: total_fees + service_fee + (referral_fee || 0),
    total_fees_in_dollars: await satsToDollars(
      total_fees + service_fee + (referral_fee || 0)
    ),
    funding_address: funding_address,
  };
}
