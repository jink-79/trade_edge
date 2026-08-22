import { Schema, model, Document } from "mongoose";

export interface IPreferences extends Document {
  userId: string;
  tradingStyles: string[];
  timeframe: string;
  defaultCapital: number;
  riskPerTrade: number;
  maxConcurrentPositions: number;
  atrPeriod: number;
  slAtrMultiplier: number;
  targetAtrMultiplier: number;
  createdAt: Date;
  updatedAt: Date;
}

const PreferencesSchema = new Schema<IPreferences>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    tradingStyles: { type: [String], default: ["swing"] },
    timeframe: { type: String, default: "Daily" },
    defaultCapital: { type: Number, default: 100000 },
    riskPerTrade: { type: Number, default: 1 },
    maxConcurrentPositions: { type: Number, default: 5 },
    atrPeriod: { type: Number, default: 14 },
    slAtrMultiplier: { type: Number, default: 0.5 },
    targetAtrMultiplier: { type: Number, default: 1 },
  },
  { timestamps: true, collection: "tradingpreferences" },
);

export const Preferences = model<IPreferences>(
  "Preferences",
  PreferencesSchema,
);
