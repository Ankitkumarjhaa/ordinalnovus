import mongoose, { Schema } from "mongoose";

export const WalletSchema = new mongoose.Schema(
  {
    ordinal_address: {
      type: String,
      required: true,
      unique: true,
    },
    cardinal_address: {
      type: String,
      required: true,
      unique: true,
    },
    wallet: {
      type: String,
      required: true,
    },
    apikey: {
      type: Schema.Types.ObjectId,
      ref: "APIkey",
      required: true,
    },
    tag: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

WalletSchema.index({ ordinal_address: 1 });
