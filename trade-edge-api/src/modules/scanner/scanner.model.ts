import { Schema, model, Types } from "mongoose";
import { SIGNAL_STATUSES } from "./scanner.types";

/**
 * The Signal Lab. Each nightly Chartink paste is a `scanner_batch`; every stock
 * in it becomes a `scanner_signal` — a PAPER trade entered at the scan-day
 * close, resolved TARGET/STOP/TIMEOUT over the following days. No real orders.
 */

export interface IScannerBatch {
  userId: string;
  scanDate: Date;
  source: string;
  rawInput: string | null;
  symbolCount: number;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const ScannerBatchSchema = new Schema<IScannerBatch>(
  {
    userId: { type: String, required: true, index: true },
    scanDate: { type: Date, required: true },
    source: { type: String, default: "chartink" },
    rawInput: { type: String, default: null },
    symbolCount: { type: Number, default: 0 },
    note: { type: String, default: null },
  },
  { timestamps: true },
);

export interface IScannerSignal {
  userId: string;
  batchId: Types.ObjectId;
  symbol: string;
  scanDate: Date;
  scanName: string; // which scan universe/filter produced it (e.g. "fno", "cash-no-smallcap")
  sector: string | null;
  marketCap: string | null;
  status: string; // OPEN | TARGET | STOP | TIMEOUT
  entry: Record<string, any> | null; // filled at first enrich
  tracking: Record<string, any> | null; // live MAE/MFE while open
  result: Record<string, any> | null; // filled on resolution
  exits: Record<string, any> | null; // exit-rule simulations (Connors 5-EMA, etc.)
  createdAt: Date;
  updatedAt: Date;
}

const ScannerSignalSchema = new Schema<IScannerSignal>(
  {
    userId: { type: String, required: true, index: true },
    batchId: { type: Schema.Types.ObjectId, ref: "ScannerBatch", index: true },
    symbol: { type: String, required: true, uppercase: true, trim: true },
    scanDate: { type: Date, required: true },
    scanName: { type: String, default: "all-cash", index: true },
    sector: { type: String, default: null },
    marketCap: { type: String, default: null },
    status: { type: String, enum: SIGNAL_STATUSES, default: "OPEN", index: true },
    entry: { type: Schema.Types.Mixed, default: null },
    tracking: { type: Schema.Types.Mixed, default: null },
    result: { type: Schema.Types.Mixed, default: null },
    exits: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true },
);

// One signal per (user, scanName, symbol, scanDate) — the same stock can live in
// multiple scan universes; re-uploading the same scan is a no-op.
ScannerSignalSchema.index(
  { userId: 1, scanName: 1, symbol: 1, scanDate: 1 },
  { unique: true },
);

// Latest backtest snapshot per user (see docs/architecture/scanner-backtest.md).
export interface IScannerPerformance {
  userId: string;
  asOf: Date;
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

const ScannerPerformanceSchema = new Schema<IScannerPerformance>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    asOf: { type: Date },
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

export const ScannerPerformance = model<IScannerPerformance>(
  "ScannerPerformance",
  ScannerPerformanceSchema,
  "scanner_performance",
);

export const ScannerBatch = model<IScannerBatch>(
  "ScannerBatch",
  ScannerBatchSchema,
  "scanner_batches",
);
export const ScannerSignal = model<IScannerSignal>(
  "ScannerSignal",
  ScannerSignalSchema,
  "scanner_signals",
);
