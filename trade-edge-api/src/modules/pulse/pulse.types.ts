import { z } from "zod";
import { PartialBacktestMetricsSchema, SymbolScorecardRowSchema, TradeLogRowSchema } from "../reports/report.types";

/**
 * Pulse Weekly — v10 Pulse Breaker snapshots posted by the `pulse_trader` courier.
 * See docs/architecture/pulse-weekly.md. The Python side owns the compute; these
 * schemas validate the envelope, keeping the heavy nested shapes permissive
 * (arrays of `any`) exactly as scanner performance does.
 *
 * `metrics` (below) and the symbol-scorecard row shape are the SAME shared
 * schema `backtestArchive` uses for uploaded reports (src/modules/reports) —
 * see strategies/S001_pulse_breaker/BACKTEST_REPORT_SCHEMA.md — so live and
 * archived results render through identical frontend components.
 */

const anyRecord = z.record(z.string(), z.any());

export const DEFAULT_VARIANT = "v10-tracked";

// ── POST /api/pulse/scan — a weekend scan run (ranked order list) ──────────────

export const SavePulseScanSchema = z.object({
  variant: z.string().min(1).max(60).trim().default(DEFAULT_VARIANT),
  asOf: z.coerce.date(),
  universe: z.string().max(60).optional(),
  universeSize: z.number().int().nonnegative().default(0),
  symbolsWithData: z.number().int().nonnegative().default(0),
  openPositions: z.number().int().nonnegative().default(0),
  freeSlots: z.number().int().nonnegative().default(0),
  equity: z.number().nonnegative().default(0),
  cash: z.number().nonnegative().default(0),
  exits: z.array(z.any()).default([]),
  candidates: z.array(z.any()).default([]),
});
export type SavePulseScanInput = z.infer<typeof SavePulseScanSchema>;

// ── POST /api/pulse/performance — a variant's backtest snapshot ────────────────

export const SavePulsePerformanceSchema = z.object({
  variant: z.string().min(1).max(60).trim().default(DEFAULT_VARIANT),
  label: z.string().max(120).optional(),
  asOf: z.coerce.date().optional(),
  config: anyRecord.optional(),
  // Full BACKTEST_REPORT_SCHEMA.md shape (§1-16), but every field is optional
  // so the current courier (which doesn't send the newer fields yet — SQN,
  // Kelly %, drawdown episodes, sector/cap breakdown, etc.) keeps working
  // unchanged; posting the fuller payload is additive, not a breaking change.
  metrics: PartialBacktestMetricsSchema,
  equityCurve: z.array(z.any()).default([]),
  monthlyReturns: z.array(z.any()).default([]),
  benchmarkCurve: z.array(z.any()).default([]),
  tradeCount: z.number().default(0),
  sampleWarning: z.string().nullable().optional(),
});
export type SavePulsePerformanceInput = z.infer<typeof SavePulsePerformanceSchema>;

// ── Queries ───────────────────────────────────────────────────────────────────

export const VariantQuerySchema = z.object({
  variant: z.string().max(60).optional(),
});
export type VariantQuery = z.infer<typeof VariantQuerySchema>;

// GET /api/pulse/weeks — optional [from, to] window so the blotter doesn't
// have to fetch a strategy's entire history to show "all weeks".
export const WeeksQuerySchema = z.object({
  variant: z.string().max(60).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
export type WeeksQuery = z.infer<typeof WeeksQuerySchema>;

// ── POST /api/pulse/weeks — a variant's full per-week blotter timeline ─────────

const PulseWeekSchema = z.object({
  week: z.coerce.date(),
  equity: z.number().default(0),
  cash: z.number().default(0),
  realizedPnl: z.number().default(0),
  unrealizedPnl: z.number().default(0),
  openValue: z.number().default(0),
  counts: anyRecord.nullable().optional(),
  rows: z.array(z.any()).default([]),
  allSignals: z.array(z.any()).default([]),
});

export const SavePulseWeeksSchema = z.object({
  variant: z.string().min(1).max(60).trim().default(DEFAULT_VARIANT),
  replace: z.boolean().default(true), // replace the variant's existing timeline
  weeks: z.array(PulseWeekSchema).max(2000),
});
export type SavePulseWeeksInput = z.infer<typeof SavePulseWeeksSchema>;

// ── POST /api/pulse/symbol-stats — per-symbol v10 scorecard for a universe ─────
// Row shape (incl. Sector + Market Cap) is the shared one from src/modules/reports.

export const SaveSymbolScorecardSchema = z.object({
  strategy: z.string().min(1).max(60).trim().default("pulse_breaker_v10"),
  universe: z.enum(["tracked", "fno"]), // doubles as the scorecard's variant key
  universeSize: z.number().int().nonnegative().default(0),
  symbolsWithData: z.number().int().nonnegative().default(0),
  periodStart: z.string().max(20).nullable().optional(),
  periodEnd: z.string().max(20).nullable().optional(),
  generatedAt: z.coerce.date(),
  symbols: z.array(SymbolScorecardRowSchema).max(5000),
});
export type SaveSymbolScorecardInput = z.infer<typeof SaveSymbolScorecardSchema>;

export const ScorecardQuerySchema = z.object({
  variant: z.enum(["tracked", "fno"]).default("tracked"),
});
export type ScorecardQuery = z.infer<typeof ScorecardQuerySchema>;

// ── POST /api/pulse/trade-log — a variant's full trade log (§19) ───────────────

export const SavePulseTradeLogSchema = z.object({
  variant: z.string().min(1).max(60).trim().default(DEFAULT_VARIANT),
  replace: z.boolean().default(true), // replace the variant's existing trade log
  rows: z.array(TradeLogRowSchema).max(20000),
});
export type SavePulseTradeLogInput = z.infer<typeof SavePulseTradeLogSchema>;

export const TradeLogQuerySchema = z.object({
  variant: z.string().min(1).max(60).trim().default(DEFAULT_VARIANT),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(500).default(100),
  symbol: z.string().max(40).trim().optional(),
});
export type TradeLogQuery = z.infer<typeof TradeLogQuerySchema>;
