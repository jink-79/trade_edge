import { Schema, model, Document, Types } from "mongoose";
import { POSSESSION_CATEGORIES, type PossessionCategory } from "./possessions.types";

// Something you own that isn't money: a bike, a fridge, a bed.
// Its value today is worked out from the price, purchase month and yearly drop.
export interface IPossession extends Document {
  userId: Types.ObjectId;
  name: string;
  category: PossessionCategory;
  purchasePrice: number;
  purchaseMonth: string; // "YYYY-MM"
  yearlyDropPct: number;
  createdAt: Date;
  updatedAt: Date;
}

const PossessionSchema = new Schema<IPossession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    category: { type: String, enum: POSSESSION_CATEGORIES, required: true },
    purchasePrice: { type: Number, required: true, min: 0 },
    purchaseMonth: { type: String, required: true, match: /^\d{4}-(0[1-9]|1[0-2])$/ },
    yearlyDropPct: { type: Number, required: true, min: 0, max: 90 },
  },
  { timestamps: true },
);

export const Possession = model<IPossession>("Possession", PossessionSchema);
