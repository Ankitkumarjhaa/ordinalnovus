import mongoose from "mongoose";

export const AllowedTokensSchema = new mongoose.Schema({
  allowed_cbrcs: {
    type: [String],
  },
});
