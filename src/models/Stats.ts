import mongoose from "mongoose";

const HistoricalDataSchema = new mongoose.Schema({
  date: Date,
  price: Number,
  volume: Number,
  volume_sats: Number,
  on_volume: Number,
  on_volume_sats: Number,
  marketCap: Number
});

const TokenSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  tick: String,
  supply: Number,
  price: Number,
  historicalData: [HistoricalDataSchema],
  // Include other relevant fields from tokensTrend and tokensHot
});

export const StatsSchema = new mongoose.Schema({
  tokens: {
    type: Number,
    required: true
  },
  dailyVolume: {
    type: Number,
    required: true
  },
  monthlyVolume: {
    type: Number,
    required: true
  },
  allTimeVolume: {
    type: Number,
    required: true
  },
  btcHeight: {
    type: Number,
    required: true
  },
  novusBtcHeight: {
    type: Number,
    required: true
  },
  mempoolBtcHeight: {
    type: Number,
    required: true
  },
  tokensTrend: [TokenSchema],
  tokensHot: [TokenSchema]
}, {
  timestamps: true
});


