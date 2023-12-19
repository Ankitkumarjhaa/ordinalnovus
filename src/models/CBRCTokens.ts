import mongoose from "mongoose";

export const CBRCTokenSchema = new mongoose.Schema(
  {
    inscription_id: {
      type: String,
      unique: true,
      required: true,
      validate: {
        validator: (value: string) => /^[a-f0-9]+i\d+$/.test(value),
        message: () =>
          "inscription_id should be in the format: c17dd02a7f216f4b438ab1a303f518abfc4d4d01dcff8f023cf87c4403cb54cai0",
      },
    },
    inscription_number: {
      type: Number,
      required: true,
      min: [0, "Inscription number must be positive"],
    },
    address: { type: String, required: true },
    tick: { type: String },
    slug: { type: String, required: true, index: true },
    supply: {
      type: Number,
      required: true,
      min: [0, "Supply must be positive"],
    },
    max: {
      type: Number,
      required: true,
      min: [0, "Max must be positive"],
    },
    lim: {
      type: Number,
      required: true,
      min: [0, "Limit must be positive"],
    },
    dec: { type: Number, min: [0, "Decimal places must be positive"] },
    fp: { type: Number, index: true },
    volume: { type: Number, index: true },
    sales: { type: Number, index: true },
    last_updated: { type: Date, index: true },
    historicalData: [
      {
        date: Date,
        fp: Number,
        volume: Number,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound index for sorting by multiple fields
CBRCTokenSchema.index({ fp: 1, volume: 1, sales: 1, last_updated: 1 });
