// models/Collection.js
const mongoose = require("mongoose");
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
export const collectionSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      maxlength: 100,
    },
    inscription_icon: { type: ObjectId, ref: "Inscription", required: true },
    icon: { type: String },
    supply: {
      type: Number,
      required: false,
      min: 0,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: function (v: any) {
          // The regex pattern allows lowercase letters, digits, and hyphens only
          const pattern = /^[a-z0-9-_]+$/;
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
    updatedBy: { type: String, required: false },
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
          const pattern = /^[a-z-]+$/;
          return tags.every((tag: any) => pattern.test(tag));
        },
        message: () =>
          `Tags should only contain lowercase letters and hyphens.`,
      },
    },
    favourites: [{ type: String }],
    volume: { type: Number, default: 0 },
    updated: { type: Number, default: 0 },
    errored: { type: Number, default: 0 },
    erroredInscriptions: [{ type: String }],
    min: { type: Number },
    max: { type: Number },
    priority: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);
collectionSchema.index({ featured: 1 });
collectionSchema.index({ verified: 1 });
collectionSchema.index({ tags: 1 });
collectionSchema.index({ priority: 1 });
collectionSchema.index({ live: 1 });
collectionSchema.index({ verified: 1 });
collectionSchema.index({ slug: 1 });
