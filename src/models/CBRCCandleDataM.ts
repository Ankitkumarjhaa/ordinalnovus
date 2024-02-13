// Import Mongoose
import mongoose from "mongoose";

// Define the schema
export const CBRCCandleDataMSchema = new mongoose.Schema(
  {
    ticker_id: {
      type: String,
      required: true,
      index: true,
    },
    timeframe: {
      type: String,
      default: "5m",
      immutable: true,
      index: true, // Prevent changes to the timeframe once set
    },
    openTime: {
      type: Date,
      required: true,
      index: true, // Improve query performance
    },
    closeTime: {
      type: Date,
      required: true,
    },
    open: {
      type: Number,
      required: true,
    },
    high: {
      type: Number,
      required: true,
    },
    low: {
      type: Number,
      required: true,
    },
    close: {
      type: Number,
      required: true,
    },
    target_volume: {
      // BTC Volume
      type: Number,
      required: true,
    },
    base_volume: {
      // TOKEN_AMOUNT
      type: Number,
      required: true,
    },
    trades: {
      type: Number,
      required: false, // Optional, depending on whether you track number of trades
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt timestamps
  }
);
