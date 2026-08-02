import { z } from "zod";

/**
 * Shared backtest-report schema — the ONE shape every strategy/version's
 * results conform to, whether they arrive live (pulse_trader courier ->
 * /api/pulse/*) or as an uploaded archive (/api/backtest-archive/*).
 *
 * Source of truth: strategies/S001_pulse_breaker/BACKTEST_REPORT_SCHEMA.md
 * in the trading_strategies repo. Field names/types here are a 1:1 mirror of
 * that doc's sections 1-16 (the scalar/small-table metrics that fit in one
 * document) — do not rename/add/remove a field without updating that doc
 * first. Sections 17 (Symbol Scorecard) and 19 (Trade Log) are NOT part of
 * `BacktestMetricsSchema` — they're large, row-oriented tables that live in
 * their own collections so they can be paginated/filtered independently.
 * Section 18 (sector/cap breakdown) is small (a handful of rows) and is kept
 * embedded here.
 *
 * "Never fabricate a missing field" (same rule as pulse_trader's data
 * loaders): every scalar defaults to `null`, every table defaults to `[]`,
 * never to 0 or an empty string standing in for "unknown".
 */

// `.coerce` so numeric-looking strings from a re-parsed XLSX/CSV cell validate
// the same as a native JSON number from the courier — `null` always short-
// circuits nullable() before coercion runs, so "missing" never becomes 0.
const numOrNull = z.coerce.number().nullable().default(null);
const intOrNull = z.coerce.number().int().nullable().default(null);
const strOrNull = z.string().nullable().default(null);
const dateOrNull = z.coerce.date().nullable().default(null);

// ── §1 General (report metadata) ────────────────────────────────────────────
export const ReportGeneralSchema = z.object({
  strategyName: z.string().min(1).max(120),
  version: z.string().min(1).max(20),
  universe: z.string().min(1).max(60), // "tracked" | "fno" | other named variant
  universeSize: intOrNull,
  symbolsWithData: intOrNull,
  symbolsTraded: intOrNull,
  market: strOrNull, // fixed "NSE" for now
  timeframe: strOrNull, // "Weekly"
  startDate: dateOrNull,
  endDate: dateOrNull,
  yearsTested: numOrNull,
  initialCapital: numOrNull,
  finalCapital: numOrNull,
  commissionPct: numOrNull,
  positionSizingRule: strOrNull,
  entryRules: strOrNull,
  exitRules: strOrNull,
  generatedAt: dateOrNull,
});

// ── §2 Returns ───────────────────────────────────────────────────────────────
const YearlyReturnSchema = z.object({
  year: intOrNull,
  returnPct: numOrNull,
});

export const ReportReturnsSchema = z.object({
  cagrPct: numOrNull,
  totalReturnPct: numOrNull,
  netProfit: numOrNull,
  avgAnnualReturnPct: numOrNull, // arithmetic mean of per-year returns (≠ CAGR)
  avgMonthlyReturnPct: numOrNull,
  yearlyReturns: z.array(YearlyReturnSchema).default([]),
  niftyCagrPct: numOrNull,
  alphaPct: numOrNull,
});

// ── §3 Risk ──────────────────────────────────────────────────────────────────
const DrawdownEpisodeSchema = z.object({
  peakDate: dateOrNull,
  troughDate: dateOrNull,
  recoveryDate: dateOrNull,
  depthPct: numOrNull,
  durationWeeks: numOrNull,
});

export const ReportRiskSchema = z.object({
  maxDrawdownPct: numOrNull,
  avgDrawdownPct: numOrNull,
  maxDrawdownWeeks: numOrNull,
  drawdownEpisodes: z.array(DrawdownEpisodeSchema).default([]), // EVERY episode, not just the worst
  recoveryWeeks: numOrNull, // worst episode's trough -> recovery
  volatilityPct: numOrNull, // annualized weekly-return std (equity curve)
  ulcerIndex: numOrNull,
});

// ── §4 Risk-Adjusted Returns ──────────────────────────────────────────────────
export const ReportRiskAdjustedSchema = z.object({
  sharpe: numOrNull,
  sortino: numOrNull,
  calmar: numOrNull, // cagrPct / |maxDrawdownPct| — also "MAR" / Return-Drawdown Ratio
});

// ── §5 Trade Statistics ───────────────────────────────────────────────────────
export const ReportTradeStatsSchema = z.object({
  totalTrades: intOrNull,
  winningTrades: intOrNull,
  losingTrades: intOrNull,
  winRatePct: numOrNull,
  lossRatePct: numOrNull,
  noTradeYears: z.array(z.coerce.number().int()).default([]),
});

// ── §6 Profitability ──────────────────────────────────────────────────────────
export const ReportProfitabilitySchema = z.object({
  profitFactor: numOrNull, // null == infinite (zero losing trades)
  expectancyPct: numOrNull, // avg trade return % (= "Average Trade %")
  medianTradePct: numOrNull,
  avgWinPct: numOrNull,
  avgLossPct: numOrNull,
  rewardRiskRatio: numOrNull, // avgWinPct / |avgLossPct| — also "Payoff Ratio"
});

// ── §7 Best/Worst Trades ───────────────────────────────────────────────────────
export const ReportBestWorstSchema = z.object({
  bestTradePct: numOrNull,
  worstTradePct: numOrNull,
  largestWinRs: numOrNull,
  largestLossRs: numOrNull,
  top10WinnersContributionPct: numOrNull,
  top10LosersContributionPct: numOrNull,
});

// ── §8 Streaks ─────────────────────────────────────────────────────────────────
export const ReportStreaksSchema = z.object({
  maxWinStreak: intOrNull,
  maxLossStreak: intOrNull,
  avgWinStreak: numOrNull, // mean length of ALL winning runs, not just the longest
  avgLossStreak: numOrNull,
});

// ── §9 Holding Period (native unit: weeks) ─────────────────────────────────────
export const ReportHoldingSchema = z.object({
  avgHoldWeeks: numOrNull,
  medianHoldWeeks: numOrNull,
  maxHoldWeeks: numOrNull,
  minHoldWeeks: numOrNull,
  avgWinningHoldWeeks: numOrNull,
  avgLosingHoldWeeks: numOrNull,
});

// ── §10 Execution ────────────────────────────────────────────────────────────
export const ReportExecutionSchema = z.object({
  avgPositionSizeRs: numOrNull,
  avgPositionCountExposure: numOrNull, // mean(open positions) / 12
  avgCapitalUtilizationPct: numOrNull, // mean(invested Rs / equity Rs) per week
  cashIdlePct: numOrNull, // 100 - avgCapitalUtilizationPct
  maxConcurrentPositions: intOrNull,
});

// ── §11 Market Exposure ────────────────────────────────────────────────────────
export const ReportMarketExposureSchema = z.object({
  timeInMarketPct: numOrNull, // % of weeks with >= 1 open position
  tradesPerYear: numOrNull,
  tradesPerMonth: numOrNull,
});

// ── §12 Equity Curve Shape ─────────────────────────────────────────────────────
export const ReportEquityCurveShapeSchema = z.object({
  equityCurveR2: numOrNull, // R² of linear fit to log(equity) vs time ("Smoothness Score")
});

// ── §13 Distribution ───────────────────────────────────────────────────────────
export const ReportDistributionSchema = z.object({
  portfolioVolatilityPct: numOrNull, // == Risk.volatilityPct, duplicated here per doc
  tradeReturnStdDevPct: numOrNull, // per-trade ReturnPct std — different from portfolioVolatilityPct
  tradeReturnSkew: numOrNull,
  tradeReturnKurtosis: numOrNull,
  profitableMonthsPct: numOrNull,
});

// ── §14 Monthly & Yearly Performance ───────────────────────────────────────────
export const ReportMonthlyYearlySchema = z.object({
  bestMonthPct: numOrNull,
  worstMonthPct: numOrNull,
  bestYearPct: numOrNull, // from Returns.yearlyReturns
  worstYearPct: numOrNull,
  positiveYearsPct: numOrNull,
});

// ── §15 Trade Quality ──────────────────────────────────────────────────────────
export const ReportTradeQualitySchema = z.object({
  sqn: numOrNull, // System Quality Number: sqrt(N) * mean(PnL) / std(PnL)
  kellyPct: numOrNull, // W - (1-W)/R
});

// ── §18 Sector-wise / Market-cap-wise Returns (one row per group) ─────────────
export const GroupBreakdownRowSchema = z.object({
  Group: z.coerce.string(), // sector name, cap bucket, or "Unclassified"
  Trades: intOrNull,
  "Win Rate %": numOrNull,
  "Net P&L (Rs)": numOrNull,
  "Profit Factor": numOrNull,
  "Avg Trade %": numOrNull,
  "% of Total Trades": numOrNull,
  "% of Total Net P&L": numOrNull,
});
export type GroupBreakdownRow = z.infer<typeof GroupBreakdownRowSchema>;

// ── §16 Portfolio / Universe Breakdown (scalar + the two small group tables) ──
export const ReportPortfolioBreakdownSchema = z.object({
  avgTradesPerSymbol: numOrNull, // totalTrades / symbolsTraded
  sectorBreakdown: z.array(GroupBreakdownRowSchema).default([]),
  marketCapBreakdown: z.array(GroupBreakdownRowSchema).default([]),
});

// ── The combined metrics document (§1-16, minus §17/§19 — see above) ──────────
// `.passthrough()` so any field NOT in this schema — e.g. the live courier's
// current `returnPct`/`trades` (pre-dating this doc's `totalReturnPct`/
// `totalTrades` naming) — survives unchanged instead of being silently
// stripped by zod's default "strip unknown keys" object behavior. Never lose
// data because a name didn't line up; new/renamed fields are purely additive.
export const BacktestMetricsSchema = ReportGeneralSchema.extend(ReportReturnsSchema.shape)
  .extend(ReportRiskSchema.shape)
  .extend(ReportRiskAdjustedSchema.shape)
  .extend(ReportTradeStatsSchema.shape)
  .extend(ReportProfitabilitySchema.shape)
  .extend(ReportBestWorstSchema.shape)
  .extend(ReportStreaksSchema.shape)
  .extend(ReportHoldingSchema.shape)
  .extend(ReportExecutionSchema.shape)
  .extend(ReportMarketExposureSchema.shape)
  .extend(ReportEquityCurveShapeSchema.shape)
  .extend(ReportDistributionSchema.shape)
  .extend(ReportMonthlyYearlySchema.shape)
  .extend(ReportTradeQualitySchema.shape)
  .extend(ReportPortfolioBreakdownSchema.shape)
  .passthrough();
export type BacktestMetrics = z.infer<typeof BacktestMetricsSchema> & Record<string, unknown>;

// A partial variant for callers (courier payloads, in-progress uploads) that
// may only have some sections computed yet — every field still defaults to
// null/[] rather than being silently dropped when absent.
export const PartialBacktestMetricsSchema = BacktestMetricsSchema.partial();
export type PartialBacktestMetrics = z.infer<typeof PartialBacktestMetricsSchema>;

// ── §17 Symbol Scorecard row (extended with Sector + Market Cap) ──────────────
export const ScorecardVerdictSchema = z.enum([
  "KEEP",
  "REVIEW",
  "ELIMINATE",
  "TOO FEW TRADES",
]);

export const SymbolScorecardRowSchema = z.object({
  Symbol: z.coerce.string(),
  Sector: strOrNull, // tracked-universe runs only; fno (CSV) leaves this null
  "Market Cap": strOrNull,
  Trades: intOrNull,
  Wins: intOrNull,
  Losses: intOrNull,
  "Win Rate %": numOrNull,
  "Net P&L (Rs)": numOrNull,
  "Gross Profit (Rs)": numOrNull,
  "Gross Loss (Rs)": numOrNull,
  "Total Charges (Rs)": numOrNull,
  "Profit Factor": numOrNull, // null == infinite
  "Avg Trade %": numOrNull,
  "Best Trade %": numOrNull,
  "Worst Trade %": numOrNull,
  "Avg Hold (weeks)": numOrNull,
  "First Entry": strOrNull,
  "Last Exit": strOrNull,
  "Sharpe Ratio": numOrNull,
  Verdict: ScorecardVerdictSchema,
});
export type SymbolScorecardRow = z.infer<typeof SymbolScorecardRowSchema>;

// ── §19 Trade Log row (every trade — powers the Signal Results / trade log page) ──
export const TradeLogRowSchema = z.object({
  "#": intOrNull,
  Symbol: z.coerce.string(),
  Sector: strOrNull,
  "Market Cap": strOrNull,
  "Entry Date": strOrNull,
  "Exit Date": strOrNull,
  "Duration (weeks)": numOrNull,
  "Entry Price": numOrNull,
  "Exit Price": numOrNull,
  Size: numOrNull,
  "P&L (Rs)": numOrNull,
  "Return (%)": numOrNull,
  "Entry Reason": strOrNull,
  "Exit Reason": strOrNull,
});
export type TradeLogRow = z.infer<typeof TradeLogRowSchema>;
