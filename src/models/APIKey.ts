import mongoose from "mongoose";

export const APIKeySchema = new mongoose.Schema(
  {
    apiKey: {
      type: String,
      required: true,
      unique: true,
    },
    count: {
      type: Number,
      required: true,
      default: 0,
    },
    startTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    wallet: {
      unique: true,
      trim: true,
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    scopes: [
      {
        scopeName: {
          type: String,
          required: true,
        },
        permissions: [
          {
            type: String,
            enum: ["read", "write", "delete"],
          },
        ],
      },
    ],
    userType: {
      type: String,
      enum: ["free", "silver", "gold", "bitcoin", "admin"],
    },
    rateLimit: {
      type: Number,
    },
    expirationDate: {
      type: Date,
      default: null,
    },
    allowedIPs: [
      {
        type: String,
        default: [],
      },
    ],
    tag: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);
