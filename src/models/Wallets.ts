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
    ordinal_pubkey: {
      type: String,
      required: true,
      unique: true,
    },
    cardinal_pubkey: {
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
    rank: {
      type: Number,
      default: 0,
    },
    cbrcRank: {
      type: Number,
      default: 0,
    },
    Volume: {
      type: Number,
      default: 0,
    },
    cbrcVolume: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

WalletSchema.index({ ordinal_address: 1 });
