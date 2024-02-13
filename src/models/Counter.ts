import mongoose, { Schema, Document } from "mongoose";

// Interface for the counter document (optional, but recommended for type checking in TypeScript)
interface ICounter extends Document {
  name: string;
  value: number;
}

// Define the schema for the counter
export const CounterSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true, // Ensure that each counter name is unique
  },
  value: {
    type: Number,
    required: true,
    default: 0, // Start counters at 0 by default
  },
});
