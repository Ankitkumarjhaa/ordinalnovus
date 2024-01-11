const mongoose = require("mongoose");

export const cbrcmarketDataSchema = new mongoose.Schema(
  {
    symbol: {
      type: String,
      required: true,
    },
    open: {
      type: Number,
      required: true,
    },
    close: {
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
    volume: {
      type: Number,
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: {
      createdAt: "timestamp",
      updatedAt: false,
    },
  }
);

// Adding an index on the 'symbol' field
cbrcmarketDataSchema.index({ symbol: 1 });

// Adding a compound index on 'symbol' and 'timestamp'
cbrcmarketDataSchema.index({ symbol: 1, timestamp: 1 });
