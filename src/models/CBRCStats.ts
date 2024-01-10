import mongoose, { Schema } from "mongoose";

const AggregateVolumeSchema = new mongoose.Schema({
  _id: String, // Token identifier
  totalAmt: Number, // Total volume for the token
});

export const CbrcStatsSchema = new mongoose.Schema(
  {
    tokens: {
      type: Number,
      required: true,
    },
    dailyVolume: {
      type: Number,
      required: true,
    },
    monthlyVolume: {
      type: Number,
      required: true,
    },
    allTimeVolume: {
      type: Number,
      required: true,
    },
    btcHeight: {
      type: Number,
      required: true,
    },
    novusBtcHeight: {
      type: Number,
      required: true,
    },
    mempoolBtcHeight: {
      type: Number,
      required: true,
    },
    tokensTrend: [
      {
        type: Schema.Types.ObjectId,
        ref: "CBRCToken",
      },
    ],
    tokensHot: [
      {
        type: Schema.Types.ObjectId,
        ref: "CBRCToken",
      },
    ],
    aggregateVolume: [AggregateVolumeSchema],
  },
  {
    timestamps: true,
  }
);
