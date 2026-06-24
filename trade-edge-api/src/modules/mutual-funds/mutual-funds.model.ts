import { Schema, model, Document, Types } from "mongoose";

export interface IMutualFund extends Document {
  date: Date;
  fundName: string;
  category: string;
  nav: number;
  units: number;
  amount: number;
  // userId will be added when POST is implemented
  userId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MutualFundSchema = new Schema<IMutualFund>(
  {
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    fundName: {
      type: String,
      required: [true, "Fund name is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    nav: {
      type: Number,
      required: [true, "NAV is required"],
      min: [0, "NAV cannot be negative"],
    },
    units: {
      type: Number,
      required: [true, "Units is required"],
      min: [0, "Units cannot be negative"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    // Placeholder — not required yet, added when POST is built
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "mutualfunds", // matches your existing collection name
  },
);

export const MutualFund = model<IMutualFund>("MutualFund", MutualFundSchema);
