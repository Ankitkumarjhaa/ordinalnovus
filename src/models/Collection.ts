// models/Collection.js
import mongoose from "mongoose";
import { Inscription } from ".";
const { Schema } = mongoose;
const { ObjectId } = Schema.Types;
const urlValidator = {
  validator: function (v: any) {
    const urlPattern =
      /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
    return v ? urlPattern.test(v) : true;
  },
  message: (props: any) => `${props.value} is not a valid URL.`,
};

interface SupplyValidatorContext {
  updated: number;
  errored: number;
}

function supplyValidator(this: SupplyValidatorContext, value: number): boolean {
  const total = this.updated + this.errored;
  return total <= value;
}

export const collectionSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      maxlength: 100,
    },
    inscription_icon: { type: ObjectId, ref: "Inscription" },
    icon: { type: String },
    supply: {
      type: Number,
      required: false,
      min: 0,
      default: 0,
      validate: {
        validator: supplyValidator,
        message: () =>
          `Updated and errored total cannot be greater than supply`,
      },
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: function (v: any) {
          // The regex pattern allows lowercase letters, digits, and hyphens only
          // const pattern = /^[a-z0-9-_]+$/;

          const pattern = /^[a-zA-Z0-9-_.]+$/; //alow uppercase and period
          return pattern.test(v);
        },
        message: (props: any) =>
          `${props.value} is not a valid slug. Slugs should only contain lowercase letters, digits, and hyphens.`,
      },
    },
    description: { type: String, required: true },
    twitter_link: { type: String, required: false, validate: urlValidator },
    discord_link: { type: String, required: false, validate: urlValidator },
    website_link: { type: String, required: false, validate: urlValidator },
    live: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
    blockchain: { type: String, enum: ["btc", "ltc", "doge"], default: "btc" },
    flagged: { type: Boolean, default: false },
    banned: { type: Boolean, default: false },
    verified: { type: Boolean, default: false },
    updated_by: { type: String, required: false },

    holders: [
      {
        address: { type: String, required: true },
        count: { type: Number, required: true, default: 0 },
      },
    ],
    holders_count: {
      type: Number,
      default: 0,
    },
    holders_check: {
      type: Date,
      default: Date.now,
    },

    type: {
      type: String,
      enum: ["official", "list"],
      default: "list",
    },
    tags: {
      type: [String],
      required: false,
      validate: {
        validator: function (tags: any) {
          const pattern = /^[^A-Z]+$/;
          return tags.every((tag: any) => pattern.test(tag));
        },
        message: () =>
          `Tags should only contain lowercase letters and hyphens.`,
      },
    },
    favorites: [{ type: String }],
    updated: { type: Number, default: 0 },
    errored: { type: Number, default: 0 },
    error: { type: Boolean, default: false },
    errored_inscriptions: [{ type: String }],
    error_tag: { type: String, default: "" },
    min: { type: Number },
    max: { type: Number },
    priority: { type: Number, default: 0 },
    json_uploaded: { type: Boolean, default: false },
    email: { type: String },
    discord_id: { type: String },
    metaprotocol: { type: String, enum: ["cbrc"], index: true },
    royalty_bp: { type: Number },
    royalty_address: { type: String },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);
collectionSchema.index({ featured: 1, verified: 1, priority: 1, live: 1 });
collectionSchema.index({ tags: 1 });
collectionSchema.index({ name: "text" });
collectionSchema.index({ slug: 1 });
collectionSchema.index({ updated: 1, errored: 1 });
collectionSchema.index({ supply: 1 });
collectionSchema.index({ json_uploaded: 1 });

collectionSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    const collectionId = this._id;

    // Assuming Inscription is already imported
    await Inscription.updateMany(
      { official_collection: collectionId },
      {
        $set: {
          official_collection: null,
          collection_item_name: null,
          collection_item_number: null,
        },
      }
    );

    next();
  }
);
