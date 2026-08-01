import { Schema, model } from "mongoose";

/**
 * Pulse Weekly collections. `pulse_trader` (Python) computes v10 and POSTs
 * snapshots; the backend only stores + serves them. See
 * docs/architecture/pulse-weekly.md. Kept separate from the daily `scanner_*`
 * collections on purpose (weekly ATR-bracket mechanics, not daily resolution).
 */

// ── pulse_runs — one weekend scan run (the ranked order list) ──────────────────
export interface IPulseRun {
  userId: string;
  variant: string;
  asOf: Date;
  universe: string | null;
  universeSize: number;
  symbolsWithData: number;
  openPositions: number;
  freeSlots: number;
  equity: number;
  cash: number;
  exits: any[];
  candidates: any[];
  createdAt: Date;
  updatedAt: Date;
}

const PulseRunSchema = new Schema<IPulseRun>(
  {
    userId: { type: String, required: true, index: true },
    variant: { type: String, required: true, default: "v10-tracked", index: true },
    asOf: { type: Date, required: true },
    universe: { type: String, default: null },
    universeSize: { type: Number, default: 0 },
    symbolsWithData: { type: Number, default: 0 },
    openPositions: { type: Number, default: 0 },
    freeSlots: { type: Number, default: 0 },
    equity: { type: Number, default: 0 },
    cash: { type: Number, default: 0 },
    exits: { type: Schema.Types.Mixed, default: [] },
    candidates: { type: Schema.Types.Mixed, default: [] },
  },
  { timestamps: true },
);
// One run per (user, variant, scan date); re-posting the same scan is an upsert.
PulseRunSchema.index({ userId: 1, variant: 1, asOf: 1 }, { unique: true });

// ── pulse_performance — latest backtest snapshot per (user, variant) ───────────
export interface IPulsePerformance {
  userId: string;
  variant: string;
  label: string | null;
  asOf: Date | null;
  config: Record<string, any> | null;
  metrics: Record<string, any> | null;
  equityCurve: any[];
  monthlyReturns: any[];
  benchmarkCurve: any[];
  tradeCount: number;
  sampleWarning: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const PulsePerformanceSchema = new Schema<IPulsePerformance>(
  {
    userId: { type: String, required: true, index: true },
    variant: { type: String, required: true, default: "v10-tracked" },
    label: { type: String, default: null },
    asOf: { type: Date, default: null },
    config: { type: Schema.Types.Mixed, default: null },
    metrics: { type: Schema.Types.Mixed, default: null },
    equityCurve: { type: Schema.Types.Mixed, default: [] },
    monthlyReturns: { type: Schema.Types.Mixed, default: [] },
    benchmarkCurve: { type: Schema.Types.Mixed, default: [] },
    tradeCount: { type: Number, default: 0 },
    sampleWarning: { type: String, default: null },
  },
  { timestamps: true },
);
// One snapshot per (user, variant) — a filter experiment is its own variant.
PulsePerformanceSchema.index({ userId: 1, variant: 1 }, { unique: true });

// ── pulse_weeks — per-week portfolio blotter (the by-date Results view) ────────
export interface IPulseWeek {
  userId: string;
  variant: string;
  week: Date;
  equity: number;
  cash: number;
  realizedPnl: number;
  unrealizedPnl: number;
  openValue: number;
  counts: any;
  rows: any[];
  allSignals: any[];
  createdAt: Date;
  updatedAt: Date;
}

const PulseWeekSchema = new Schema<IPulseWeek>(
  {
    userId: { type: String, required: true, index: true },
    variant: { type: String, required: true, default: "v10-tracked", index: true },
    week: { type: Date, required: true },
    equity: { type: Number, default: 0 },
    cash: { type: Number, default: 0 },
    realizedPnl: { type: Number, default: 0 },
    unrealizedPnl: { type: Number, default: 0 },
    openValue: { type: Number, default: 0 },
    counts: { type: Schema.Types.Mixed, default: null },
    rows: { type: Schema.Types.Mixed, default: [] },
    allSignals: { type: Schema.Types.Mixed, default: [] },
  },
  { timestamps: true },
);
// One blotter per (user, variant, week); re-posting the timeline is an upsert.
PulseWeekSchema.index({ userId: 1, variant: 1, week: 1 }, { unique: true });

export const PulseRun = model<IPulseRun>("PulseRun", PulseRunSchema, "pulse_runs");
export const PulseWeek = model<IPulseWeek>("PulseWeek", PulseWeekSchema, "pulse_weeks");
export const PulsePerformance = model<IPulsePerformance>(
  "PulsePerformance",
  PulsePerformanceSchema,
  "pulse_performance",
);
