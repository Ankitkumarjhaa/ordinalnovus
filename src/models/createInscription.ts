import { Schema } from "mongoose";

// Define the main Inscribe Order schema
export const createInscriptionSchema = new Schema(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: "Inscribe",
      required: true,
    },
    order_id: { type: String, required: true, index: true },
    privkey: { type: String, required: true, unique: true },
    receive_address: { type: String, required: true },
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
    metaprotocol: {
      type: String,
      required: true,
      enum: ["none", "cbrc"],
    },
    tick: { type: String },
    amt: { type: Number },
    op: { type: String },
    network: {
      type: String,
      required: true,
      enum: ["testnet", "mainnet"],
    },
    status: {
      type: String,
      required: true,
      index: true,
      enum: ["payment pending", "payment received", "inscribed", "cancelled"],
    },
    webhook_url: { type: String },
    fee_rate: { type: Number, required: true },
  },
  {
    timestamps: true, // Enable automatic timestamps (createdAt, updatedAt)
  }
);
