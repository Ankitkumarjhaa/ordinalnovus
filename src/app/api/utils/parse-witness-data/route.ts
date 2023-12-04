// Importing necessary modules
import { NextRequest, NextResponse } from "next/server";
import { TextDecoder } from "util";

// Initialize constants and variables
let pointer = 0;
let raw: Uint8Array = new Uint8Array();
const OP_FALSE = 0x00;
const OP_IF = 0x63;
const OP_0 = 0x00;
const OP_PUSHBYTES_3 = 0x03;
const OP_PUSHDATA1 = 0x4c;
const OP_PUSHDATA2 = 0x4d;
const OP_PUSHDATA4 = 0x4e;
const OP_ENDIF = 0x68;

// POST request handling function
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { transaction } = body; // Extract transaction from POST request payload
    const parsedInscription = parseInscription(transaction); // Parsing logic
    return NextResponse.json(parsedInscription); // Respond with parsed data
  } catch (error) {
    console.error("Error parsing inscription:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Helper function to convert hex string to Uint8Array
function hexStringToUint8Array(hex: string): Uint8Array {
  return new Uint8Array(
    hex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );
}

// Helper function to convert Uint8Array to UTF-8 string
function uint8ArrayToUtf8String(bytes: any) {
  const decoder = new TextDecoder("utf-8");
  return decoder.decode(bytes);
}

function uint8ArrayToSingleByteChars(bytes: Uint8Array): string {
  let resultStr = "";
  for (let i = 0; i < bytes.length; i++) {
    resultStr += String.fromCharCode(bytes[i]);
  }
  return resultStr;
}

function readBytes(n: number): Uint8Array {
  const slice = raw.slice(pointer, pointer + n);
  pointer += n;
  return slice;
}

function getInitialPosition(): number {
  // OP_FALSE
  // OP_IF
  // OP_PUSHBYTES_3: This pushes the next 3 bytes onto the stack.
  // 0x6f, 0x72, 0x64: These bytes translate to the ASCII string "ord"
  const inscriptionMark = new Uint8Array([
    OP_FALSE,
    OP_IF,
    OP_PUSHBYTES_3,
    0x6f,
    0x72,
    0x64,
  ]);

  const position = raw.findIndex((_byte, index) =>
    raw
      .slice(index, index + inscriptionMark.length)
      .every((val, i) => val === inscriptionMark[i])
  );

  if (position === -1) {
    // throw new Error('No ordinal inscription found in transaction');
    return position;
  }
  return position + inscriptionMark.length;
}

function readPushdata(): Uint8Array {
  const opcode = readBytes(1)[0];

  // Opcodes from 0x01 to 0x4b (decimal values 1 to 75) are special opcodes that indicate a data push is happening.
  // Specifically, they indicate the number of bytes to be pushed onto the stack.
  // This checks if the current opcode represents a direct data push of 1 to 75 bytes.
  // If this condition is true, then read the next opcode number of bytes and treat them as data
  if (0x01 <= opcode && opcode <= 0x4b) {
    return readBytes(opcode);
  }

  let numBytes: number;
  switch (opcode) {
    case OP_PUSHDATA1:
      numBytes = 1;
      break;
    case OP_PUSHDATA2:
      numBytes = 2;
      break;
    case OP_PUSHDATA4:
      numBytes = 4;
      break;
    default:
      throw new Error(
        `Invalid push opcode ${opcode.toString(16)} at position ${pointer}`
      );
  }

  const dataSizeArray = readBytes(numBytes);
  let dataSize = 0;
  for (let i = 0; i < numBytes; i++) {
    dataSize |= dataSizeArray[i] << (8 * i);
  }
  return readBytes(dataSize);
}

function hasInscription(witness: string[]): boolean {
  const inscriptionMarkHex = "0063036f7264";
  const witnessJoined = witness.join("");
  return witnessJoined.includes(inscriptionMarkHex);
}

export interface ParsedInscription {
  contentType: string;
  base64Data: any;
  data: any;
  // fields: { [key: string]: Uint8Array };
  getDataUri: () => string;
}

export function parseInscription(transaction: {
  vin: { witness?: string[] }[];
}) {
  const witness = transaction.vin[0]?.witness;
  if (!witness) {
    return null;
  }

  const txWitness = witness.join("");
  raw = hexStringToUint8Array(txWitness);
  pointer = getInitialPosition();

  if (pointer === -1) {
    console.debug("No Inscription found! ");
    return null;
  }

  try {
    // Process fields until OP_0 is encountered
    const fields: { [key: string]: Uint8Array } = {};
    while (pointer < raw.length && raw[pointer] !== OP_0) {
      const tag = uint8ArrayToUtf8String(readPushdata());
      const value = readPushdata();

      fields[tag] = value;
    }

    // Now we are at the beginning of the body
    // (or at the end of the raw data if there's no body)
    // --> Question: are empty inscriptions allowed?
    if (pointer < raw.length && raw[pointer] === OP_0) {
      pointer++; // skip OP_0
    }

    // Collect body data until OP_ENDIF
    const data: Uint8Array[] = [];
    while (pointer < raw.length && raw[pointer] !== OP_ENDIF) {
      data.push(readPushdata());
    }

    const combinedLengthOfAllArrays = data.reduce(
      (acc, curr) => acc + curr.length,
      0
    );
    const combinedData = new Uint8Array(combinedLengthOfAllArrays);

    // Copy all segments from data into combinedData, forming a single contiguous Uint8Array
    let idx = 0;
    for (const segment of data) {
      combinedData.set(segment, idx);
      idx += segment.length;
    }

    const contentType = uint8ArrayToUtf8String(fields["\u0001"]);
    // const contentString = InscriptionParserService.uint8ArrayToUtf8String(combinedData);

    // Let's ignore inscriptions without a contentType, because there is (right now) no good way to display them
    if (!contentType) {
      return null;
    }
    const base64Data = Buffer.from(combinedData).toString("base64");

    return {
      contentType,
      base64Data,
      data: {
        ...((contentType.includes("text") || contentType.includes("json")) && {
          string: base64ToString(base64Data),
        }),
      },
      // contentString,
      // fields,
      getDataUri: (): string => {
        const base64Data = Buffer.from(combinedData).toString("base64");
        return `data:${contentType};base64,${base64Data}`;
      },
    };
  } catch (ex) {
    console.error(ex);
    return null;
  }
}

function base64ToString(base64: string): string {
  const buffer = Buffer.from(base64, "base64");
  return buffer.toString("utf-8");
}
