import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import dbConnect from "@/lib/dbConnect";
import { Inscription } from "@/models";
import { IInscription } from "@/types/Ordinals";

type Inscription = {
  txid: string;
  vout: number;
  output: string;
  scriptpubkey_address: string;
  value: number;
};

async function fetchInscriptions(
  inscriptionOutput: Inscription[]
): Promise<any[]> {
  const inscriptions: any[] = [];
  for (const { output } of inscriptionOutput) {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_PROVIDER}/api/output/${output}`
      );
      if (response.data?.inscriptions) {
        inscriptions.push(...response.data.inscriptions);
      }
    } catch (error) {
      console.error(`Error fetching inscriptions for output ${output}:`, error);
    }
  }
  return inscriptions;
}

function parseInputs(data: any): any {
  const allInputs: any[] = [];
  const inscriptionInput: Inscription[] = [];
  const addedTxIds = new Set<string>();

  data.vin.map((input: any) => {
    allInputs.push({
      txid: input.txid,
      vout: input.vout,
      output: input.txid + ":" + input.vout,
      scriptpubkey_address: input.prevout.scriptpubkey_address,
      value: input.prevout.value,
    });
    if (
      input.prevout.scriptpubkey_type === "v1_p2tr" &&
      !addedTxIds.has(input.txid) &&
      input.prevout.scriptpubkey_asm.includes("OP_PUSHNUM_1 OP_PUSHBYTES_32")
    ) {
      inscriptionInput.push({
        txid: input.txid,
        vout: input.vout,
        output: input.txid + ":" + input.vout,
        scriptpubkey_address: input.prevout.scriptpubkey_address,
        value: input.prevout.value,
      });
      addedTxIds.add(input.txid);
    }
  });

  return {inscriptionInput, allInputs};
}

function parseOutputs(data: any, txid: string): Inscription[] {
  const inscriptionOutput: Inscription[] = [];

  data.vout.map((output: any, i: number) => {
    inscriptionOutput.push({
      txid: txid,
      vout: i,
      output: txid + ":" + i,
      scriptpubkey_address: output.scriptpubkey_address,
      value: output.value,
    });
  });

  return inscriptionOutput;
}

function constructTxData(
  inscriptions: any[],
  allInputs: Inscription[],
  inscriptionOutput: Inscription[]
): any {
  let txData: any = null;

  if (inscriptions.length === 1) {
    txData = {
      from: allInputs[2].scriptpubkey_address,
      to: inscriptionOutput[1].scriptpubkey_address,
      price: inscriptionOutput[2].value,
      inscription: inscriptions[0]
    };
  }

  return txData;
}

async function fetchTransactionData(txid: string): Promise<any> {
  const response = await axios.get("https://mempool.space/api/tx/" + txid);
  const data = response.data;
  const {inscriptionInput, allInputs} = parseInputs(data);
  const inscriptionOutput = parseOutputs(data, txid);
  const inscriptions = await fetchInscriptions(inscriptionOutput);
  return { inscriptionInput, inscriptionOutput, inscriptions, allInputs };
}

async function findHistoricalInscriptionData(
  txid: string,
  txids: string[] = []
): Promise<{ inscription: IInscription | null; txids: string[] }> {
  console.log(`Finding historical inscription data for txid: ${txid}`);
  try {
    const isGenesisTxid = await Inscription.find({
      genesis_transaction: txid,
    }).exec();
    if (isGenesisTxid.length) {
      console.log(`Genesis transaction found for txid: ${txid}`);
      return { inscription: isGenesisTxid[0], txids };
    } else {
      console.log(`going level ${txids.length} deep`);
      txids.push(txid);
      const { inscriptionInput } = await fetchTransactionData(txid);
      console.log(
        `Recursively fetching data for txid: ${inscriptionInput[0].txid}`
      );
      if (inscriptionInput.length < 1) {
        return { inscription: null, txids };
      }
      console.log(`found ${inscriptionInput.length} inscription input`);
      return await findHistoricalInscriptionData(
        inscriptionInput[0].txid,
        txids
      );
    }
  } catch (error) {
    console.error(
      `Error fetching historical inscription data for txid ${txid}:`,
      error
    );
    throw error;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).end("Method Not Allowed");
  }

  await dbConnect();

  try {
    const { txid } = req.body;
    const { inscriptions, inscriptionInput, inscriptionOutput, allInputs } =
      await fetchTransactionData(txid);

    let historicalData; // Define variable outside of the condition to be used later

    if (inscriptions.length === 0 && inscriptionInput.length === 1) {
      console.log(" no inscription data found. going level 1 deep");
      historicalData = await findHistoricalInscriptionData(
        inscriptionInput[0].txid,
        [txid]
      );
    }

    console.log(`constructing txData`);

    const txData = constructTxData(
      historicalData?.inscription ? [historicalData.inscription] : inscriptions,
      allInputs,
      inscriptionOutput
    );

    res.status(200).json({
      message: "TXID parsed successfully",
      data: txData,
      historicalData,
      inscriptions: historicalData?.inscription
        ? [historicalData.inscription]
        : inscriptions,
      allInputs,
      inscriptionInput,
      inscriptionOutput,
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({
      message: "Error fetching txid data",
    });
  }
}
