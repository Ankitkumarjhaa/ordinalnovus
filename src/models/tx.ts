import mongoose, { Schema } from "mongoose";

// Define the VinSchema and VoutSchema as discussed earlier
const VinSchema: Schema = new Schema({
  txid: { type: String, required: true },
  vout: { type: Number, required: false },
  prevout: { type: Schema.Types.Mixed },
  scriptsig: { type: String, default: "" },
  scriptsig_asm: { type: String, default: "" },
  witness: { type: Array },
  is_coinbase: { type: Boolean, default: false },
  sequence: { type: Number, default: 0 },
  inner_witnessscript_asm: { type: String, default: "" },
});

const VoutSchema: Schema = new Schema({
  scriptpubkey: { type: String, required: false },
  scriptpubkey_asm: { type: String, required: false },
  scriptpubkey_type: { type: String, required: false },
  scriptpubkey_address: { type: String, required: false },
  value: { type: Number, required: true },
});

export const TXCacheSchema = new mongoose.Schema(
  {
    txid: {
      type: String,
      required: true,
      unique: true,
    },
    parsed: {
      type: Boolean,
      required: true,
      default: false,
    },
    inscriptions: [{ type: String }],
    from: { type: String },
    to: { type: String },
    price: { type: Number },
    tag: {
      type: String,
    },
    blockhash: { type: Schema.Types.ObjectId, ref: "Block" },
    height: { type: Number, required: true },

    // new fields
    version: { type: Number },
    locktime: { type: Number },
    vin: { type: [VinSchema] }, // Include VinSchema as an array
    vout: { type: [VoutSchema] }, //
    size: { type: Number },
    weight: { type: Number },
    fee: { type: Number },
    status: { confirmed: { type: Boolean } },
    marketplace: { type: String },
    timestamp: { type: Date, required: true },
    token: { type: String },
    amount: { type: Number },
    metaprotocol: { type: String },
    price_per_token: { type: Number },
    parsed_metaprotocol: {
      type: [String],
      set: function (value: string) {
        // Check if the value is a string and not empty
        if (typeof value === "string" && value.trim().length > 0) {
          // Split the string by a delimiter (e.g., comma), trim and convert each part to lowercase
          return value.split(":").map((item) => item.trim().toLowerCase());
        } else {
          return [];
        }
      },
    },
    added_to_sales: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

TXCacheSchema.index(
  { added_to_sales: 1, marketplace: 1 },
  {
    partialFilterExpression: {
      $or: [{ added_to_sales: false }, { added_to_sales: { $exists: false } }],
      marketplace: "ordinalnovus",
    },
  }
);
TXCacheSchema.index({ txid: 1, height: 1 });
TXCacheSchema.index({ tag: 1 });
TXCacheSchema.index({ parsed: 1 });
TXCacheSchema.index({ from: 1, to: 1, price: 1, marketplace: 1 });
TXCacheSchema.index({ inscription: 1 });
TXCacheSchema.index({ blockhash: 1 });
TXCacheSchema.index({ timestamp: -1 });
TXCacheSchema.index({ parsed_metaprotocol: 1 }, { sparse: true });
