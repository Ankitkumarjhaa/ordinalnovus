import mongoose, { Schema } from "mongoose";

export const TXCacheSchema = new mongoose.Schema(
  {
    txid: {
      type: String,
      required: true,
      unique: true,
    },
    parsed: {
      type: Boolean,
      required: true,
      default: false,
    },
    inscriptions: [{ type: String }],
    from: { type: String },
    to: { type: String },
    price: { type: Number },
    tag: {
      type: String,
    },
    blockhash: { type: Schema.Types.ObjectId, ref: "Block" },

    // new fields
    version: { type: Number },
    locktime: { type: Number },
    vin: { type: Array }, // Define a more precise type based on the structure
    vout: { type: Array }, // Define a more precise type based on the structure
    size: { type: Number },
    weight: { type: Number },
    fee: { type: Number },
    status: { confirmed: { type: Boolean } },
  },
  {
    timestamps: true,
  }
);

TXCacheSchema.index({ tag: 1 });
TXCacheSchema.index({ parsed: 1 });
TXCacheSchema.index({ from: 1 });
TXCacheSchema.index({ inscription: 1 });
TXCacheSchema.index({ to: 1 });
TXCacheSchema.index({blockhash: 1})
