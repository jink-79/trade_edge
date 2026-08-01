import { z } from "zod";

export const SIGNAL_STATUSES = ["OPEN", "TARGET", "STOP", "TIMEOUT"] as const;
export type SignalStatus = (typeof SIGNAL_STATUSES)[number];

/** Paper trades time out (TIMEOUT) if unresolved after this many sessions. */
export const MAX_HOLD_DAYS = 10;

const CandleSchema = z.object({
  date: z.string(),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volume: z.number(),
});

// ── Ingest a nightly Chartink paste ───────────────────────────────────────────

export const CreateBatchSchema = z.object({
  scanDate: z.coerce.date(),
  symbols: z
    .array(z.string().min(1).max(20).trim().toUpperCase())
    .min(1)
    .max(500),
  scanName: z.string().min(1).max(50).trim().default("all-cash"),
  rawInput: z.string().max(50_000).optional(),
  note: z.string().max(500).optional(),
});
export type CreateBatchInput = z.infer<typeof CreateBatchSchema>;

// ── Bulk upload (Chartink backtest CSV: Date, Symbol, Marketcap, Sector) ──────

export const UploadSignalsSchema = z.object({
  source: z.string().max(50).default("chartink-upload"),
  scanName: z.string().min(1).max(50).trim().default("all-cash"),
  note: z.string().max(500).optional(),
  rows: z
    .array(
      z.object({
        scanDate: z.coerce.date(),
        symbol: z.string().min(1).max(20).trim().toUpperCase(),
        sector: z.string().max(100).trim().optional(),
        marketCap: z.string().max(50).trim().optional(),
      }),
    )
    .min(1)
    .max(50000),
});
export type UploadSignalsInput = z.infer<typeof UploadSignalsSchema>;

// ── Enrich one signal with candles (agent now, Python courier later) ──────────

export const EnrichSignalSchema = z.object({
  candles: z.array(CandleSchema).min(2), // daily OHLCV up to today
  indexCandles: z.array(CandleSchema).default([]), // Nifty daily OHLCV
});
export type EnrichSignalInput = z.infer<typeof EnrichSignalSchema>;

// Enrich all open signals for a symbol from one candle set (bulk courier path).
export const EnrichBySymbolSchema = z.object({
  symbol: z.string().min(1).max(20).trim().toUpperCase(),
  candles: z.array(CandleSchema).min(2),
  indexCandles: z.array(CandleSchema).default([]),
});
export type EnrichBySymbolInput = z.infer<typeof EnrichBySymbolSchema>;

// ── Query ─────────────────────────────────────────────────────────────────────

export const ListSignalsQuerySchema = z.object({
  status: z.enum(SIGNAL_STATUSES).optional(),
  batchId: z.string().optional(),
  date: z.string().optional(), // YYYY-MM-DD — a single scan day
  scanName: z.string().optional(), // filter to one scan universe
});
export type ListSignalsQuery = z.infer<typeof ListSignalsQuerySchema>;

// ── Backtest performance snapshot (posted by the Python courier) ──────────────

const anyRecord = z.record(z.string(), z.any());

export const SavePerformanceSchema = z.object({
  asOf: z.coerce.date().optional(),
  config: anyRecord.optional(),
  metrics: anyRecord,
  equityCurve: z.array(z.any()).default([]),
  monthlyReturns: z.array(z.any()).default([]),
  benchmarkCurve: z.array(z.any()).default([]),
  tradeCount: z.number().default(0),
  sampleWarning: z.string().nullable().optional(),
});
export type SavePerformanceInput = z.infer<typeof SavePerformanceSchema>;
