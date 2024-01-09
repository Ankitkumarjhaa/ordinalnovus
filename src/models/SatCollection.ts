import mongoose, { Schema, Document } from "mongoose";

// Define the main schema
export const satsCollSchema = new mongoose.Schema(
  {
    sat: { type: Number, required: true, unique: true },
    inscription_id: { type: String, required: true, unique: true },
    collection_item_name: { type: String, set: (v: string) => v.trim() },
    collection_item_number: { type: Number },
    // collection detail
    official_collection: {
      type: Schema.Types.ObjectId,
      ref: "Collection",
      required: true,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

satsCollSchema.index({ official_collection: 1 });
satsCollSchema.index({ collection_item_number: 1 });
