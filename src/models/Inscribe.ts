import mongoose, { Schema, Document, Mixed } from "mongoose";

// Define the File sub-document schema
const FileSchema = new Schema({
  file_type: { type: String, required: true },
  file_name: { type: String, required: true },
  base64_data: { type: String, required: true },
  file_size: { type: Number, required: true },
  inscription_address: { type: String, required: true },
  txid: { type: String, required: false },
  leaf: { type: String, required: true },
  tapkey: { type: String, required: true },
  cblock: { type: String, required: true },
  inscription_fee: { type: Number, required: true },
  inscription_id: { type: String },
});

// Define the main Inscribe Order schema
export const InscribeSchema = new Schema(
  {
    order_id: { type: String, required: true },
    funding_address: { type: String, required: true, unique: true },
    privkey: { type: String, required: true, unique: true },
    receive_address: { type: String, required: true },
    chain_fee: { type: Number, required: true },
    service_fee: { type: Number, required: true },
    inscriptions: { type: [FileSchema], required: true },
    cursed: { type: Boolean, required: true, default: false },
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
        "refunded",
        "inscribed",
      ],
    },
    webhook_url: { type: String },
    fee_rate: { type: Number, required: true },
    txid: { type: String },
    referrer: { type: String, required: false },
    referral_fee: { type: Number, required: false },
  },
  {
    timestamps: true, // Enable automatic timestamps (createdAt, updatedAt)
  }
);
