import { z } from "zod";

/**
 * Pulse Weekly — v10 Pulse Breaker snapshots posted by the `pulse_trader` courier.
 * See docs/architecture/pulse-weekly.md. The Python side owns the compute; these
 * schemas validate the envelope, keeping the heavy nested shapes permissive
 * (arrays of `any`) exactly as scanner performance does.
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
  metrics: anyRecord,
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
