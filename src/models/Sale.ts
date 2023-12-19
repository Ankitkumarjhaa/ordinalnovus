import mongoose, { Schema, Document } from "mongoose";

// Define the main schema
export const salesSchema = new mongoose.Schema(
  {
    inscription: {
      type: Schema.Types.ObjectId,
      ref: "Inscription",
      required: true,
    },
    inscription_id: {
      type: String,
      required: true,
      validate: {
        validator: (value: string) => /^[a-f0-9]+i\d+$/.test(value),
        message: () =>
          "inscription_id should be in the format: c17dd02a7f216f4b438ab1a303f518abfc4d4d01dcff8f023cf87c4403cb54cai0",
      },
    },
    output_value: { type: Number },
    location: {
      type: String,
      required: true,
      validate: {
        validator: (value: string) => /^[\da-f]+:\d+:\d+$/.test(value),
        message: () => "location should have two ':' followed by numbers.",
      },
    },

    // Sale
    sale_date: { type: Date, required: true },
    fee: { type: Number, required: true },
    price: { type: Number, required: true },
    from: { type: String, required: true },
    seller_receive_address: { type: String },
    to: { type: String, required: true },
    txid: { type: String, required: true },
    marketplace_fee: { type: Number, required: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

salesSchema.index({ to: 1, from: 1, price: 1 });
salesSchema.index({ sale_date: 1 });
salesSchema.index({ inscription_id: 1 });
