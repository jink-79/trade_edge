import { Schema, model } from "mongoose";
import {
  CLOSE_POSITIONS,
  DATA_QUALITIES,
  DIRECTIONS,
  MARKET_TRENDS,
  OUTCOMES,
  RULE_ADHERENCES,
  VOLUME_CHARACTERS,
} from "./journal.types";

/**
 * The trade journal IS the positions system.
 * Open trades live in `openpositions`; on exit they move to `closedpositions`
 * — the same collections the dashboard & analytics read.
 *
 * Each doc carries the rich journal shape (nested entry/exit for the UI) PLUS
 * flat top-level mirror fields (entryPrice, qty, pnlAmount, …) so the
 * dashboard/analytics Position & Trade models read them with no code change.
 */

const EntrySchema = new Schema(
  {
    ticker: { type: String, required: true, uppercase: true, trim: true },
    entryDate: { type: Date, required: true },
    direction: { type: String, enum: DIRECTIONS, required: true },
    entryPrice: { type: Number, required: true },
    quantity: { type: Number, required: true },
    // Absent for strategies with no fixed exit levels (e.g. trend-flip-only).
    targetPrice: { type: Number, default: null },
    stopPrice: { type: Number, default: null },
    rs55Pct: { type: Number, default: null },
    atr14: { type: Number, required: true },

    priceAbove200: { type: Boolean, required: true },
    distanceFrom200Ema: { type: Number, required: true },
    rsi2: { type: Number, required: true },
    candlesFromHigh: { type: Number, required: true },

    pullbackDepth: { type: Number, required: true },
    entryCandleClose: { type: String, enum: CLOSE_POSITIONS, required: true },
    distanceTo50Ema: { type: Number, required: true },
    downMoveVolume: { type: String, enum: VOLUME_CHARACTERS, required: true },
    targetUnderResistance: { type: Boolean, required: true },
    stopHasSupport: { type: Boolean, required: true },

    niftyVs200Ema: { type: String, enum: MARKET_TRENDS, required: true },
    niftyRsi2: { type: Number, required: true },
    sector: { type: String, default: "", trim: true },
    // phalanx-live's own sector/cap-bucket reference data (symbols
    // collection) — null when phalanx hasn't backfilled that symbol yet.
    marketCapCategory: { type: String, default: null },
    gappedIntoEntry: { type: Boolean, required: true },
    candlesAvailable: { type: Number, required: true },
    eventWithinWindow: { type: Boolean, required: true },

    screenshot: { type: String, default: null },
    aiAnalysis: { type: String, default: null },
    notes: { type: String, default: null },
  },
  { _id: false },
);

const ExitSchema = new Schema(
  {
    outcome: { type: String, enum: OUTCOMES.filter((o) => o !== "STILL-OPEN") },
    exitPrice: { type: Number },
    exitDate: { type: Date },
    manualExitReason: { type: String, default: null },
    stopWickedThenRecovered: { type: Boolean, default: null },
    targetTaggedThenReversed: { type: Boolean, default: null },
    maxAdverseExcursion: { type: Number, default: null },
    screenshot: { type: String, default: null },
    aiAnalysis: { type: String, default: null },
  },
  { _id: false },
);

export interface IJournalTrade {
  userId: string;
  tradeNumber: number;
  entry: Record<string, any>;
  exit: Record<string, any> | null;
  outcome: string;
  dataQuality: string;
  dataQualityNote: string | null;
  source: string;
  // which trading strategy produced this trade — absent on trades logged
  // before strategy tagging was added (treated as "rsi2" by convention)
  strategyId?: string | null;
  needsReview: boolean;
  gttPlaced: boolean;
  ruleAdherence?: string | null;
  ruleAdherenceNote?: string | null;
  analytics?: Record<string, any> | null;
  // ── flat mirrors (read by dashboard/analytics Position & Trade models) ──
  symbol?: string;
  stockName?: string;
  sector?: string;
  side?: string;
  entryPrice?: number;
  quantity?: number;
  qty?: number;
  entryDate?: Date;
  tradeDate?: Date;
  targetPrice?: number;
  stopPrice?: number;
  exitPrice?: number | null;
  exitDate?: Date | null;
  exitReason?: string | null;
  pnlAmount?: number | null;
  pnlPercent?: number | null;
  rMultiple?: number | null;
  // last Kite LTP seen for this open position, set by broker-sync
  markPrice?: number | null;
  markUpdatedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const JournalTradeSchema = new Schema<IJournalTrade>(
  {
    userId: { type: String, required: true, index: true },
    tradeNumber: { type: Number, required: true },
    entry: { type: EntrySchema, required: true },
    exit: { type: ExitSchema, default: null },
    outcome: { type: String, enum: OUTCOMES, default: "STILL-OPEN" },
    dataQuality: { type: String, enum: DATA_QUALITIES, default: "clean" },
    dataQualityNote: { type: String, default: null },
    source: { type: String, enum: ["manual", "auto"], default: "manual" },
    strategyId: { type: String, default: null },
    needsReview: { type: Boolean, default: false },
    gttPlaced: { type: Boolean, default: false },
    ruleAdherence: { type: String, enum: RULE_ADHERENCES, default: null },
    ruleAdherenceNote: { type: String, default: null },
    analytics: { type: Schema.Types.Mixed, default: null },

    // flat mirrors
    symbol: { type: String, default: null },
    stockName: { type: String, default: null },
    sector: { type: String, default: null },
    side: { type: String, default: null },
    entryPrice: { type: Number, default: null },
    quantity: { type: Number, default: null },
    qty: { type: Number, default: null },
    entryDate: { type: Date, default: null },
    tradeDate: { type: Date, default: null },
    targetPrice: { type: Number, default: null },
    stopPrice: { type: Number, default: null },
    exitPrice: { type: Number, default: null },
    exitDate: { type: Date, default: null },
    exitReason: { type: String, default: null },
    pnlAmount: { type: Number, default: null },
    pnlPercent: { type: Number, default: null },
    rMultiple: { type: Number, default: null },
    markPrice: { type: Number, default: null },
    markUpdatedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Two models, same schema, different collections. Open trades in openpositions;
// closed trades (post-exit) in closedpositions.
export const JournalOpen = model<IJournalTrade>(
  "JournalOpen",
  JournalTradeSchema,
  "openpositions",
);
export const JournalClosed = model<IJournalTrade>(
  "JournalClosed",
  JournalTradeSchema.clone(),
  "closedpositions",
);
