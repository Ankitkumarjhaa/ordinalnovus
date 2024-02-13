import mongoose, { Schema } from "mongoose";

// Define the main schema
export const salesSchema = new mongoose.Schema(
  {
    inscriptions: [
      {
        type: Schema.Types.ObjectId,
        ref: "Inscription",
        required: true,
      },
    ],
    inscription_ids: [
      {
        type: String,
        required: true,
        validate: {
          validator: (value: string) => /^[a-f0-9]+i\d+$/.test(value),
          message: () =>
            "inscription_id should be in the format: hexadecimalStringiIndex",
        },
      },
    ],
    // Sale
    type: { type: String, required: true },
    price: { type: mongoose.Schema.Types.Decimal128, required: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    txid: { type: String, required: true },
    trade_timestamp: { type: Date, required: true },
    trade_id: { type: Number, required: true, unique: true },
    official_collections: [
      {
        type: Schema.Types.ObjectId,
        ref: "Collection",
        required: true,
      },
    ],
    metaprotocol: { type: String },
    parsed_metaprotocol: {
      type: [String],
      set: function (value: string) {
        // Check if the value is a string and not empty
        if (typeof value === "string" && value.trim().length > 0) {
          // Split the string by a delimiter (e.g., comma), trim and convert each part to lowercase
          return value.split(":").map((item) => item.trim().toLowerCase());
        } else {
          return [];
        }
      },
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

salesSchema.index({ to: 1, from: 1, price: 1 });
salesSchema.index({ sale_date: 1 });
salesSchema.index({ inscription_id: 1 });
