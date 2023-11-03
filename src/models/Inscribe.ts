import mongoose, { Schema, Document, Mixed } from "mongoose";

// Define the File sub-document schema
const FileSchema = new Schema({
  file_type: { type: String, required: true },
  file_name: { type: String, required: true },
  base64_data: { type: String, required: true },
  file_size: { type: Number, required: true },
  inscription_address: { type: String, required: true },
  script: { type: Schema.Types.Mixed, required: true },
  txid: { type: String, required: false },
  leaf: { type: String, required: true },
  tapkey: { type: String, required: true },
  cblock: { type: String, required: true },
  inscription_fee: { type: Number, required: true },
});

// Define the main Inscribe Order schema
export const InscribeSchema = new Schema(
  {
    funding_address: { type: String, required: true, unique: true },
    privkey: { type: String, required: true, unique: true },
    receive_address: { type: String, required: true },
    chain_fee: { type: Number, required: true },
    service_fee: { type: Number, required: true },
    files: { type: [FileSchema], required: true },
    network: {
      type: String,
      required: true,
      enum: ["testnet", "mainnet"],
    },
    status: {
      type: String,
      required: true,
      enum: [
        "payment pending",
        "payment received",
        "insufficient balance",
        "inscribed",
      ],
    },
    txid: { type: String },
    referrer: { type: String, required: false }, // Optional field
  },
  {
    timestamps: true, // Enable automatic timestamps (createdAt, updatedAt)
  }
);
