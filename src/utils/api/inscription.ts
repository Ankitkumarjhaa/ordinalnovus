// utils/inscription.ts

import axios from "axios";
import { load } from "cheerio";
export interface InscriptionData {
  number: number | null;
  id: string;
  address: string;
  output_value: string;
  sat: string;
  preview: string | undefined;
  content: string | undefined;
  content_length: string;
  content_type: string;
  timestamp: string;
  genesis_height: string;
  genesis_fee: string;
  genesis_transaction: string;
  location: string;
  output: string;
  offset: string;
  decimal: string;
  degree: string;
  percentile: string;
  name: string;
  cycle: string;
  epoch: string;
  period: string;
  block: string;
  rarity: string;
  inscription: string | undefined;
}

const inscriptionRegex = /^[0-9A-Fa-f]{64}i\d$/gm;

async function fetchInscriptionId(number: string) {

   const response = await axios.get(`${process.env.NEXT_PUBLIC_PROVIDER}/api/inscriptions/${number}`);
          const inscriptionId = response.data.inscriptions[0].href.split("/")[2];

  return inscriptionId;
}

async function fetchInscriptionData(inscriptionId: string) {
  const response = await axios.get(
    `${process.env.NEXT_PUBLIC_PROVIDER}/api/inscription/${inscriptionId}`
  );
  
  const responseData = response.data;

  const data = {
    number: responseData.number,
    id: inscriptionId,
    address: responseData.address,
    output_value: responseData.output_value, // Make sure the API response includes 'output_value'
    sat: responseData.sat,
    preview: responseData.preview, // Make sure the API response includes 'preview'
    content: responseData.content, // Make sure the API response includes 'content'
    content_length: responseData.content_length,
    content_type: responseData.content_type,
    timestamp: responseData.timestamp,
    genesis_height: responseData.genesis_height,
    genesis_fee: responseData.genesis_fee,
    genesis_transaction: responseData.genesis_transaction,
    location: responseData.location,
    output: responseData.output,
    offset: responseData.offset,
    satName: responseData.sat_name,
    decimal: responseData.decimal || "",
    degree: responseData.degree || "",
    percentile: responseData.percentile || "",
    name: responseData.name || "",
    cycle: responseData.cycle || "",
    epoch: responseData.epoch || "",
    period: responseData.period || "",
    block: responseData.block || "",
    rarity: responseData.rarity || "",
    inscription: responseData.inscription || "", // Make sure the API response includes 'inscription'
  };


  return data;
}

// New function to fetch sat data
async function fetchSatData(satNumber: string) {
  const response = await axios.get(
    `${process.env.NEXT_PUBLIC_PROVIDER}/sat/${satNumber}`
  );
  const $ = load(response.data);

  const satData = {
    decimal: $('dt:contains("decimal")').next().text(),
    degree: $('dt:contains("degree")').next().text(),
    percentile: $('dt:contains("percentile")').next().text(),
    name: $('dt:contains("name")').next().text(),
    cycle: $('dt:contains("cycle")').next().text(),
    epoch: $('dt:contains("epoch")').next().text(),
    period: $('dt:contains("period")').next().text(),
    block: $('dt:contains("block")').next().children().text(),
    offset: $('dt:contains("offset")').next().text(),
    rarity: $('dt:contains("rarity")').next().children().text(),
    timestamp: $('dt:contains("timestamp")').next().children().text(),
    inscription: $('dt:contains("inscription")').next().children().attr("href"),
  };

  return satData;
}

export async function fetchInscription(id: string | number) {
  if (!id && id!==0) {
    throw new Error("Inscription number or ID is required.");
  }

  try {
    let inscriptionId = "";
    if (inscriptionRegex.test(id + "")) {
      inscriptionId = id + "";
    } else {
      inscriptionId = await fetchInscriptionId(id + "");
    }

    const data: InscriptionData = await fetchInscriptionData(inscriptionId);
    return data;
  } catch (error) {
    throw new Error("An error occurred while fetching the inscription data.");
  }
}
