import mongoose, { Schema } from "mongoose";

// Enhanced Schema Definition
export const cbrcSalesSchema = new mongoose.Schema(
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
    official_collections: [
      {
        type: Schema.Types.ObjectId,
        ref: "Collection",
        required: true,
      },
    ],
    ticker_id: { type: String },
    type: { type: String, required: true },
    price: { type: mongoose.Schema.Types.Decimal128, required: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    txid: { type: String, required: true },
    trade_timestamp: { type: Date, required: true },
    base_volume: { type: mongoose.Schema.Types.Decimal128, required: true },
    target_volume: { type: mongoose.Schema.Types.Decimal128, required: true },
    trade_id: { type: Number, required: true, unique: true },
    token: { type: String, required: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Optimize Indexes
cbrcSalesSchema.index({ to: 1, from: 1, trade_timestamp: -1 });
cbrcSalesSchema.index({ trade_id: 1 }, { unique: true });
// Additional indexes can be added based on query patterns
