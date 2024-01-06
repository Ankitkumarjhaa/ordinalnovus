import { Schema } from "mongoose";

// Define the main Inscribe Order schema
export const InscribeOrderSchema = new Schema(
  {
    order_id: { type: String, required: true },
    receive_address: { type: String, required: true, index: true },
    chain_fee: { type: Number, required: true },
    service_fee: { type: Number, required: true },
    psbt: { type: String },
    txid: { type: String },
    referrer: { type: String, required: false, index: true },
    referral_fee: { type: Number, required: false },
    status: {
      type: String,
      required: true,
      index: true,
      enum: ["payment pending", "payment received", "inscribed", "cancelled"],
    },
  },
  {
    timestamps: true, // Enable automatic timestamps (createdAt, updatedAt)
  }
);
