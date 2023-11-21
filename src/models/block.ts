import mongoose from "mongoose";

export const BlocksSchema = new mongoose.Schema(
  {
    height: {
      type: Number,
      required: true,
      unique: true,
    },
    id: {
      type: String,
      required: true,
      unique: true,
    },
    tx_count: {
      type: Number,
      required: true,
    },
    previousblockhash: {
      type: String,
      required: true,
    },
    processed: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

BlocksSchema.index({ processed: 1, height: 1 });
