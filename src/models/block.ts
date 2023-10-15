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
  },
  {
    timestamps: true,
  }
);
