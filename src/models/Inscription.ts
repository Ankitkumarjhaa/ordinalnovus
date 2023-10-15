import mongoose from "mongoose";

const Schema = mongoose.Schema;

export const inscriptionSchema = new mongoose.Schema(
  {
    inscriptionId: {
      type: String,
      required: false,
      unique: true,
    },
    content: { type: String },
    sha: { type: String },
    officialCollection: { type: Schema.Types.ObjectId, ref: "Collection" },
    name: { type: String },
    attributes: { type: Schema.Types.Mixed },
    preview: { type: String },
    flagged: { type: Boolean, default: false },
    banned: { type: Boolean, default: false, required: true },
    reason: { type: String },
    updated_by: { type: String },
    block: { type: Number },
    content_length: { type: Number },
    content_type: { type: String },
    cycle: { type: Number },
    decimal: { type: String },
    degree: { type: String },
    epoch: { type: Number },
    genesis_address: { type: String },
    genesis_fee: { type: Number },
    genesis_height: { type: Number },
    genesis_transaction: { type: String },
    location: { type: String },
    number: { type: Number, required: true },
    percentile: { type: String },
    period: { type: Number },
    rarity: { type: String },
    sat: { type: Number },
    sat_name: { type: String },
    timestamp: { type: Date },
    // dynamic
    sat_offset: { type: Number },
    lists: [{ type: Schema.Types.ObjectId, ref: "Collection" }],
    tags: {
      type: Array,
      required: false,
      validate: {
        validator: function (tags: any[]) {
          const pattern = /^[a-z-]+$/;
          return tags.every((tag) => pattern.test(tag));
        },
        message: () =>
          `Tags should only contain lowercase letters and hyphens.`,
      },
    },
    error: { type: Boolean, default: false },
    // New fields
    offset: { type: Number },
    output: { type: String },
    output_value: { type: Number },
    address: { type: String },
    listed: { type: Boolean },
    listedAt: { type: Date },
    listedPrice: { type: Number }, //in sats
    listedMakerFeeBp: { type: Number },
    tapInternalKey: { type: String },
    listedSellerReceiveAddress: { type: String },
    signedPsbt: { type: String },
    unSignedPsbt: { type: String },
    satBlockTime: { type: Date },
    sattributes: [{ type: String }],
    lastChecked: { type: Date },
    version: { type: Number },
    brc20: { type: Boolean, default: false },
    token: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Keep these indexes as they are frequently used in queries.
inscriptionSchema.index({ number: 1 }, { sparse: true });
inscriptionSchema.index({ address: 1, number: 1 });
inscriptionSchema.index({ sha: 1 }, { sparse: true });
inscriptionSchema.index({ genesis_transaction: 1 }, { sparse: true });
inscriptionSchema.index({ inscriptionId: 1 }, { sparse: true });
inscriptionSchema.index({ officialCollection: 1 }, { sparse: true });
inscriptionSchema.index({ sat_name: 1 }, { sparse: true });
inscriptionSchema.index({ version: 1, sha: 1, content_type: 1, number: 1 });

inscriptionSchema.index({
  content: "text",
  content_type: "text",
  sat_name: "text",
  sha: "text",
  name: "text",
});

//temporary index. remove after rarity added till 25Million
inscriptionSchema.index({ genesis_transaction: 1, error: 1 });
