import mongoose, { Schema } from "mongoose";

export const APIUsageLogSchema = new mongoose.Schema({
  apikey: {
    type: Schema.Types.ObjectId,
    ref: "APIkey",
    required: true,
  },
  accessedAt: { type: Date, default: Date.now },
  endpoint: { type: String, required: true },
  // Other fields as necessary
});

APIUsageLogSchema.index({ apikey: 1 });
APIUsageLogSchema.index({ endpoint: 1 });
