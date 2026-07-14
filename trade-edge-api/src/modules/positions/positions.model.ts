import { Schema, model, Document, Types } from "mongoose";

export interface IPosition extends Document {
  userId: Types.ObjectId;
  stockName: string;
  stockSymbol: string;
  sector: string;
  tradeDate: Date;
  side: "long" | "short";
  entryPrice: number;
  quantity: number;
  investedAmount: number;
  timeframe: "daily" | "weekly" | "monthly";
  notes?: string;
  // ── Weekly market snapshot — backfilled by the sync script; null until first run ──
  lastClosedWeeklyClose: number | null;
  highestCloseSinceEntry: number | null;
  structureExitLow: number | null;
  trailingActive: boolean;
  trailingStopPrice: number | null;
  trailActivatedDate: Date | null;
  exitSignal: boolean;
  exitReason: string | null;
  lastCandleDate: Date | null;
  pnlPercent: number | null;
  lastSyncedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const PositionSchema = new Schema<IPosition>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    stockName: {
      type: String,
      required: [true, "Stock name is required"],
      trim: true,
      maxlength: [100, "Stock name must be at most 100 characters"],
    },
    stockSymbol: {
      type: String,
      required: [true, "Stock symbol is required"],
      trim: true,
      uppercase: true,
      maxlength: [20, "Stock symbol must be at most 20 characters"],
    },
    sector: {
      type: String,
      required: [true, "Sector is required"],
      trim: true,
      maxlength: [100, "Sector must be at most 100 characters"],
    },
    tradeDate: {
      type: Date,
      required: [true, "Trade date is required"],
    },
    side: {
      type: String,
      enum: ["long", "short"],
      required: [true, "Side is required"],
    },
    entryPrice: {
      type: Number,
      required: [true, "Entry price is required"],
      min: [0, "Entry price cannot be negative"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },
    investedAmount: {
      type: Number,
      required: true,
      min: [0, "Invested amount cannot be negative"],
    },
    timeframe: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
      required: [true, "Timeframe is required"],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes must be at most 500 characters"],
    },

    // ── Weekly market snapshot ──────────────────────────────────────────────
    // These are populated by the weekly Python sync script (latest weekly close,
    // trailing-stop state, exit signals). They stay null/false on manual create.
    lastClosedWeeklyClose: { type: Number, default: null },
    highestCloseSinceEntry: { type: Number, default: null },
    structureExitLow: { type: Number, default: null },
    trailingActive: { type: Boolean, default: false },
    trailingStopPrice: { type: Number, default: null },
    trailActivatedDate: { type: Date, default: null },
    exitSignal: { type: Boolean, default: false },
    exitReason: { type: String, default: null, trim: true },
    lastCandleDate: { type: Date, default: null },
    pnlPercent: { type: Number, default: null },
    lastSyncedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    // Read/write the Python scanner's open-positions collection
    collection: "openpositions",
  },
);

export const Position = model<IPosition>("Position", PositionSchema);
