import { Schema, model } from "mongoose";

/**
 * Backtest Archive — historical/one-off backtest runs (v1-v9 and any future
 * research-only version that never goes live) uploaded as the two artifacts
 * BACKTEST_REPORT_SCHEMA.md requires (XLSX/CSV + MD). Deliberately SEPARATE
 * from the `pulse_*` collections (src/modules/pulse) so uploaded data never
 * gets confused with live courier-posted data — but both use the exact same
 * field shapes (src/modules/reports) so the frontend renders either through
 * identical components.
 */

// ── backtest_archive_reports — one per (user, strategyName, version, universe) ──
export interface IBacktestArchiveReport {
  userId: string;
  strategyName: string;
  version: string;
  universe: string;
  status: "adopted" | "rejected" | "superseded" | "diagnostic" | null; // MD frontmatter
  supersedes: string | null; // MD frontmatter — the version this one replaces
  date: string | null; // MD frontmatter — the run's date (YYYY-MM-DD, as written)
  mdBody: string | null; // raw markdown body (What Changed/Why/Results/Validation/Decision) — rendered as-is, never re-parsed
  metrics: Record<string, any>; // BacktestMetrics shape (src/modules/reports) — Mixed, shape owned by the schema doc
  sourceFiles: { xlsx: string | null; csv: string | null; md: string | null }; // original uploaded filenames, for traceability
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BacktestArchiveReportSchema = new Schema<IBacktestArchiveReport>(
  {
    userId: { type: String, required: true, index: true },
    strategyName: { type: String, required: true, index: true },
    version: { type: String, required: true },
    universe: { type: String, required: true },
    status: { type: String, default: null },
    supersedes: { type: String, default: null },
    date: { type: String, default: null },
    mdBody: { type: String, default: null },
    metrics: { type: Schema.Types.Mixed, required: true },
    sourceFiles: {
      xlsx: { type: String, default: null },
      csv: { type: String, default: null },
      md: { type: String, default: null },
    },
    uploadedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true },
);
// Re-uploading the same strategy+version+universe replaces the prior archive entry.
BacktestArchiveReportSchema.index(
  { userId: 1, strategyName: 1, version: 1, universe: 1 },
  { unique: true },
);

// ── backtest_archive_symbol_scorecard — one per (user, strategyName, version, universe) ──
export interface IBacktestArchiveSymbolStats {
  userId: string;
  strategyName: string;
  version: string;
  universe: string;
  symbols: any[]; // SymbolScorecardRow[] (src/modules/reports) — Mixed
  createdAt: Date;
  updatedAt: Date;
}

const BacktestArchiveSymbolStatsSchema = new Schema<IBacktestArchiveSymbolStats>(
  {
    userId: { type: String, required: true, index: true },
    strategyName: { type: String, required: true, index: true },
    version: { type: String, required: true },
    universe: { type: String, required: true },
    symbols: { type: Schema.Types.Mixed, default: [] },
  },
  { timestamps: true },
);
BacktestArchiveSymbolStatsSchema.index(
  { userId: 1, strategyName: 1, version: 1, universe: 1 },
  { unique: true },
);

// ── backtest_archive_trade_log — one document per trade, for pagination ────────
export interface IBacktestArchiveTradeLogRow {
  userId: string;
  strategyName: string;
  version: string;
  universe: string;
  symbol: string; // pulled out of row.Symbol for indexing/filtering
  exitDate: Date | null; // pulled out of row["Exit Date"] for sorting
  row: any; // the full TradeLogRow (src/modules/reports) — Mixed
  createdAt: Date;
  updatedAt: Date;
}

const BacktestArchiveTradeLogRowSchema = new Schema<IBacktestArchiveTradeLogRow>(
  {
    userId: { type: String, required: true, index: true },
    strategyName: { type: String, required: true, index: true },
    version: { type: String, required: true },
    universe: { type: String, required: true },
    symbol: { type: String, required: true, index: true },
    exitDate: { type: Date, default: null },
    row: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true },
);
BacktestArchiveTradeLogRowSchema.index({
  userId: 1,
  strategyName: 1,
  version: 1,
  universe: 1,
  exitDate: 1,
});

export const BacktestArchiveReport = model<IBacktestArchiveReport>(
  "BacktestArchiveReport",
  BacktestArchiveReportSchema,
  "backtest_archive_reports",
);
export const BacktestArchiveSymbolStats = model<IBacktestArchiveSymbolStats>(
  "BacktestArchiveSymbolStats",
  BacktestArchiveSymbolStatsSchema,
  "backtest_archive_symbol_scorecard",
);
export const BacktestArchiveTradeLogRow = model<IBacktestArchiveTradeLogRow>(
  "BacktestArchiveTradeLogRow",
  BacktestArchiveTradeLogRowSchema,
  "backtest_archive_trade_log",
);
