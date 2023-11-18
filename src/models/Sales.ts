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
      unique: true,
      required: true,
      validate: {
        validator: (value: string) => /^[a-f0-9]+i\d+$/.test(value),
        message: () =>
          "inscription_id should be in the format: c17dd02a7f216f4b438ab1a303f518abfc4d4d01dcff8f023cf87c4403cb54cai0",
      },
    },
    // collection detail
    official_collection: {
      type: Schema.Types.ObjectId,
      ref: "Collection",
      sparse: true,
    },
    collection_item_name: { type: String, trim: true },
    collection_item_number: { type: Number },
    offset: { type: Number },
    output_value: { type: Number },
    output: {
      type: String,
      required: true,
      validate: {
        validator: (value: string) => /^[\da-f]+:\d+$/.test(value),
        message: () => "output should have one ':' followed by a number.",
      },
    },
    location: {
      type: String,
      required: true,
      validate: {
        validator: (value: string) => /^[\da-f]+:\d+:\d+$/.test(value),
        message: () => "location should have two ':' followed by numbers.",
      },
    },
    address: {
      type: String,
      validate: {
        validator: function (this: any, value: string) {
          return (
            !value ||
            (value &&
              this.output &&
              this.location &&
              this.output_value !== null)
          );
        },
        message:
          'If "address" is provided, "output", "location", and "output_value" must also be provided.',
      },
    },

    // Sale
    sold_at: { type: Date },
    fee: { type: Number },
    seller_tap_internal_key: { type: String, trim: true },
    listed_seller_receive_address: { type: String },
    signed_seller_psbt: { type: String, required: true },
    signed_buyer_psbt: { type: String, required: true },
    buyer_payment_address: { type: String, required: true },
    buyer_ordinal_address: { type: String, required: true },
    buyer_tap_internal_key: { type: String, required: true },
    price: { type: Number, required: true },
    price_in_usd: { type: Number, required: true },
    tx: { type: String, required: true },
    status: {
      type: String,
      enum: ["confirmed", "rejected", "mempool"],
      required: true,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

salesSchema.index({
  collection_item_number: 1,
  price: 1,
  sold_at: 1,
  seller_address: 1,
  buyer_address: 1,
  inscription_id: 1,
});
