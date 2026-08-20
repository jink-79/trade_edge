import { z } from "zod";
import { STRATEGIES } from "../preferences/preferences.types";

// ── Enums ─────────────────────────────────────────────────────────────────────

export const DIRECTIONS = ["LONG", "SHORT"] as const;
export const OUTCOMES = ["TARGET", "STOP", "TREND-FLIP", "MANUAL-EXIT", "STILL-OPEN"] as const;
export const CLOSE_POSITIONS = [
  "at-low",
  "lower-third",
  "mid",
  "upper-third",
  "at-high",
] as const;
export const VOLUME_CHARACTERS = [
  "climactic",
  "above-average",
  "average",
  "quiet",
] as const;
export const MARKET_TRENDS = ["up", "down"] as const;
export const DATA_QUALITIES = ["clean", "excludable"] as const;
/** Did the trade follow the system, or was it a discretionary call? */
export const RULE_ADHERENCES = ["system", "discretionary"] as const;

export type ClosePosition = (typeof CLOSE_POSITIONS)[number];
export type VolumeCharacter = (typeof VOLUME_CHARACTERS)[number];
export type MarketTrend = (typeof MARKET_TRENDS)[number];

// A base64 data URI can be large; cap to ~7M chars (≈5 MB image).
const screenshot = z.string().max(7_000_000).optional();

// ── Entry schema (locked once exit is written) ────────────────────────────────

export const TradeEntrySchema = z.object({
  // Tier 1 · identity & execution
  ticker: z.string().min(1).max(20).trim().toUpperCase(),
  entryDate: z.coerce.date(),
  direction: z.enum(DIRECTIONS),
  entryPrice: z.number().positive(),
  quantity: z.number().positive(),
  // Absent for strategies with no fixed exit levels (e.g. trend-flip-only).
  targetPrice: z.number().positive().optional(),
  stopPrice: z.number().positive().optional(),
  rs55Pct: z.number().optional(),
  atr14: z.number().min(0),

  // Tier 1 · rule-check VALUES
  priceAbove200: z.boolean(),
  distanceFrom200Ema: z.number(),
  rsi2: z.number(),
  candlesFromHigh: z.number().min(0),

  // Tier 2 · diagnostic
  pullbackDepth: z.number(),
  entryCandleClose: z.enum(CLOSE_POSITIONS),
  distanceTo50Ema: z.number(),
  downMoveVolume: z.enum(VOLUME_CHARACTERS),
  targetUnderResistance: z.boolean(),
  stopHasSupport: z.boolean(),

  // Tier 3 · context
  niftyVs200Ema: z.enum(MARKET_TRENDS),
  niftyRsi2: z.number(),
  sector: z.string().max(100).trim().default(""),
  gappedIntoEntry: z.boolean(),
  candlesAvailable: z.number().min(0),
  eventWithinWindow: z.boolean(),

  // chart + Claude's read at entry
  screenshot,
  aiAnalysis: z.string().max(20_000).optional(),
  notes: z.string().max(2_000).optional(),
});

export const CreateJournalTradeSchema = z.object({
  entry: TradeEntrySchema,
  dataQuality: z.enum(DATA_QUALITIES).default("clean"),
  dataQualityNote: z.string().max(500).optional(),
});

export type CreateJournalTradeInput = z.infer<typeof CreateJournalTradeSchema>;

// ── Exit schema (Phase 2 — written once, locks the entry) ─────────────────────

export const ExitJournalTradeSchema = z
  .object({
    outcome: z.enum(["TARGET", "STOP", "TREND-FLIP", "MANUAL-EXIT"]),
    exitPrice: z.number().positive(),
    exitDate: z.coerce.date(),
    manualExitReason: z.string().max(500).trim().optional(),
    stopWickedThenRecovered: z.boolean().optional(),
    targetTaggedThenReversed: z.boolean().optional(),
    maxAdverseExcursion: z.number().optional(),
    screenshot,
    aiAnalysis: z.string().max(20_000).optional(),
  })
  .refine(
    (d) =>
      d.outcome !== "MANUAL-EXIT" ||
      (d.manualExitReason != null && d.manualExitReason.trim().length > 0),
    {
      message: "A manual-exit reason is required",
      path: ["manualExitReason"],
    },
  );

export type ExitJournalTradeInput = z.infer<typeof ExitJournalTradeSchema>;

// ── Auto-capture (from a Kite trade + candles) ────────────────────────────────

export const CandleSchema = z.object({
  date: z.string(),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volume: z.number(),
});

export const AutoCaptureSchema = z.object({
  symbol: z.string().min(1).max(20).trim().toUpperCase(),
  entryDate: z.coerce.date(),
  entryPrice: z.number().positive(),
  quantity: z.number().positive(),
  direction: z.enum(DIRECTIONS).default("LONG"),
  // Which strategy produced this trade — gates whether target/stop get
  // derived from ATR multiples (only meaningful for "rsi2").
  strategyId: z.enum(STRATEGIES),
  rs55Pct: z.number().optional(),
  // Optional plan — else derived from ATR × the user's Preferences multipliers
  // (rsi2 only; other strategies leave these unset).
  // (Explicit multipliers here override Preferences; else Preferences win.)
  targetPrice: z.number().positive().optional(),
  stopPrice: z.number().positive().optional(),
  slAtrMultiplier: z.number().positive().optional(),
  targetAtrMultiplier: z.number().positive().optional(),
  sector: z.string().max(100).trim().optional(),
  candlesAvailable: z.number().optional(),
  candles: z.array(CandleSchema).min(2), // stock daily OHLCV
  indexCandles: z.array(CandleSchema).default([]), // Nifty daily OHLCV
});

export type AutoCaptureInput = z.infer<typeof AutoCaptureSchema>;

// ── Manual entry (Trend+RS-55 only — candles fetched server-side from ─────────
// phalanx-live's own OHLCV, no Kite session needed) ────────────────────────────

export const ManualEntrySchema = z.object({
  symbol: z.string().min(1).max(20).trim().toUpperCase(),
  entryPrice: z.number().positive(),
  quantity: z.number().positive(),
  entryDate: z.coerce.date().optional(),
});

export type ManualEntryInput = z.infer<typeof ManualEntrySchema>;

// ── Review (fill screenshot + Claude's comment, then confirm) ─────────────────

export const ReviewJournalTradeSchema = z.object({
  screenshot,
  aiAnalysis: z.string().max(20_000).optional(),
  targetUnderResistance: z.boolean().optional(),
  stopHasSupport: z.boolean().optional(),
  sector: z.string().max(100).trim().optional(),
  eventWithinWindow: z.boolean().optional(),
  dataQuality: z.enum(DATA_QUALITIES).optional(),
  notes: z.string().max(2_000).optional(),
});

export type ReviewJournalTradeInput = z.infer<typeof ReviewJournalTradeSchema>;

export const GttPlacedSchema = z.object({ placed: z.boolean() });
export type GttPlacedInput = z.infer<typeof GttPlacedSchema>;

// ── Rule adherence (behavioural tag) ──────────────────────────────────────────

export const SetAdherenceSchema = z.object({
  ruleAdherence: z.enum(RULE_ADHERENCES).nullable(),
  ruleAdherenceNote: z.string().max(500).trim().optional(),
});
export type SetAdherenceInput = z.infer<typeof SetAdherenceSchema>;

// ── Trade-path analytics (MAE/MFE + exit optimizer) ───────────────────────────

export const AnalyzeTradeSchema = z.object({
  candles: z.array(CandleSchema).min(2), // daily OHLCV spanning entry → exit/now
});
export type AnalyzeTradeInput = z.infer<typeof AnalyzeTradeSchema>;

// ── Response types ────────────────────────────────────────────────────────────

export interface JournalTradeResponse {
  id: string;
  tradeNumber: number;
  entry: Record<string, unknown>;
  exit: Record<string, unknown> | null;
  outcome: (typeof OUTCOMES)[number];
  dataQuality: (typeof DATA_QUALITIES)[number];
  dataQualityNote?: string | null;
  source: string;
  strategyId?: string | null;
  needsReview: boolean;
  gttPlaced: boolean;
  ruleAdherence?: string | null;
  ruleAdherenceNote?: string | null;
  analytics?: Record<string, unknown> | null;
  markPrice?: number | null;
  markUpdatedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
