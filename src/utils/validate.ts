import { IInscription } from "@/types";
import { stringToHex } from ".";

export function inscriptionListed(item: IInscription) {
  if (
    item.inscription_id &&
    item.inscription_number &&
    item.address &&
    item.listed &&
    item.listed_price
  )
    return true;
  else return false;
}

export function cbrcListed(item: IInscription, allowedList: string[]) {
  if (
    item.inscription_id &&
    item.inscription_number &&
    item.address &&
    item.listed &&
    item.listed_price &&
    item.listed_price > 0 &&
    item.listed_seller_receive_address &&
    item.listed_price_per_token &&
    item.listed_token &&
    cbrcValid(item, allowedList)
  )
    return true;
  else return false;
}

export function cbrcNotListed(item: IInscription, allowedList: string[]) {
  if (
    item.inscription_id &&
    item.inscription_number &&
    item.address &&
    !item.listed &&
    !item.listed_price &&
    cbrcValid(item, allowedList)
  )
    return true;
  else return false;
}

export function cbrcValid(item: IInscription, allowedList: string[]) {
  if (
    item.inscription_id &&
    item.inscription_number &&
    item.address &&
    item.tags?.includes("cbrc") &&
    item.metaprotocol?.includes("cbrc") &&
    item.parsed_metaprotocol &&
    item.parsed_metaprotocol.length === 3 &&
    (item.parsed_metaprotocol[0] === "cbrc-20" ||
      item.parsed_metaprotocol[0] === "CBRC-20") &&
    (item.parsed_metaprotocol[1] === "transfer" ||
      item.parsed_metaprotocol[1] === "TRANSFER") &&
    item.parsed_metaprotocol[2].includes("=") &&
    item.parsed_metaprotocol[2].split("=")[0].length === 4 &&
    Number(item.parsed_metaprotocol[2].split("=")[1]) > 0 &&
    item.cbrc_valid &&
    allowedList?.includes(
      stringToHex(
        item.parsed_metaprotocol[2].split("=")[0].trim().toLowerCase()
      )
    )
  )
    return true;
  else return false;
}

export function myInscription(item: IInscription, myAddress: string) {
  if (
    item.inscription_id &&
    item.inscription_number &&
    item.address === myAddress
  )
    return true;
  else return false;
}
