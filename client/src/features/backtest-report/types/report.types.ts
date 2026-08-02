// The unified "Backtest Report" shape — same fields regardless of whether the
// data came live (pulse_trader courier -> /api/pulse/*) or from an uploaded
// archive (/api/backtest-archive/*). Mirrors trade-edge-api's shared
// BacktestMetricsSchema (src/modules/reports) — see
// strategies/S001_pulse_breaker/BACKTEST_REPORT_SCHEMA.md. `null` means "not
// available" for that run/source and must render as such, never fabricated.

export const STRATEGY = "Pulse Breaker";

// The tracked Mongo universe is the only universe we run/report on — it's the
// real live list and is treated as the superset. (Historically there was also
// an "fno" CSV variant; retired — tracked only.)
export type ReportUniverse = "tracked";
export type DataSource = "live" | "archive";
export type DocStatus = "adopted" | "rejected" | "superseded" | "diagnostic";
export type Verdict = "KEEP" | "REVIEW" | "ELIMINATE" | "TOO FEW TRADES";

export type Num = number | null;

export const UNIVERSES: { id: ReportUniverse; label: string }[] = [
  { id: "tracked", label: "Tracked" },
];

export interface VersionRef {
  strategyName: string;
  version: string; // e.g. "11", "10", "9" — matches BACKTEST_REPORT_SCHEMA.md's `version` field (string)
  universe: ReportUniverse;
  status: DocStatus | null;
  supersedes: string | null;
  date: string | null;
  source: DataSource;
  label: string | null; // display label, e.g. live PulsePerformance.label
  key: string; // stable react key / URL param, e.g. "v11-tracked-live"
}

// ── §1-16 metrics, one flat object (matches BacktestMetricsSchema exactly) ──
export interface BacktestMetrics {
  strategyName: string;
  version: string;
  universe: string;
  universeSize: Num;
  symbolsWithData: Num;
  symbolsTraded: Num;
  market: string | null;
  timeframe: string | null;
  startDate: string | null;
  endDate: string | null;
  yearsTested: Num;
  initialCapital: Num;
  finalCapital: Num;
  commissionPct: Num;
  positionSizingRule: string | null;
  entryRules: string | null;
  exitRules: string | null;
  generatedAt: string | null;

  cagrPct: Num;
  totalReturnPct: Num;
  netProfit: Num;
  avgAnnualReturnPct: Num;
  avgMonthlyReturnPct: Num;
  yearlyReturns: { year: Num; returnPct: Num }[];
  niftyCagrPct: Num;
  alphaPct: Num;

  maxDrawdownPct: Num;
  avgDrawdownPct: Num;
  maxDrawdownWeeks: Num;
  drawdownEpisodes: { peakDate: string | null; troughDate: string | null; recoveryDate: string | null; depthPct: Num; durationWeeks: Num }[];
  recoveryWeeks: Num;
  volatilityPct: Num;
  ulcerIndex: Num;

  sharpe: Num;
  sortino: Num;
  calmar: Num;

  totalTrades: Num;
  winningTrades: Num;
  losingTrades: Num;
  winRatePct: Num;
  lossRatePct: Num;
  noTradeYears: number[];

  profitFactor: Num;
  expectancyPct: Num;
  medianTradePct: Num;
  avgWinPct: Num;
  avgLossPct: Num;
  rewardRiskRatio: Num;

  bestTradePct: Num;
  worstTradePct: Num;
  largestWinRs: Num;
  largestLossRs: Num;
  top10WinnersContributionPct: Num;
  top10LosersContributionPct: Num;

  maxWinStreak: Num;
  maxLossStreak: Num;
  avgWinStreak: Num;
  avgLossStreak: Num;

  avgHoldWeeks: Num;
  medianHoldWeeks: Num;
  maxHoldWeeks: Num;
  minHoldWeeks: Num;
  avgWinningHoldWeeks: Num;
  avgLosingHoldWeeks: Num;

  avgPositionSizeRs: Num;
  avgPositionCountExposure: Num;
  avgCapitalUtilizationPct: Num;
  cashIdlePct: Num;
  maxConcurrentPositions: Num;

  timeInMarketPct: Num;
  tradesPerYear: Num;
  tradesPerMonth: Num;

  equityCurveR2: Num;

  portfolioVolatilityPct: Num;
  tradeReturnStdDevPct: Num;
  tradeReturnSkew: Num;
  tradeReturnKurtosis: Num;
  profitableMonthsPct: Num;

  bestMonthPct: Num;
  worstMonthPct: Num;
  bestYearPct: Num;
  worstYearPct: Num;
  positiveYearsPct: Num;

  sqn: Num;
  kellyPct: Num;

  avgTradesPerSymbol: Num;
  sectorBreakdown: GroupBreakdownRow[];
  marketCapBreakdown: GroupBreakdownRow[];

  // Not in the schema doc but carried on live PulsePerformance docs — used
  // for the equity/monthly charts (already stored today, unlike most of the
  // §1-16 fields above which the courier doesn't send yet).
  equityCurve?: { date: string; equity: number | null }[];
  monthlyReturns?: { month: string; ret: number | null }[];
  benchmarkCurve?: { date: string; value: number | null }[];
  concurrency?: { date: string; open: number | null }[];
}

export interface GroupBreakdownRow {
  Group: string;
  Trades: Num;
  "Win Rate %": Num;
  "Net P&L (Rs)": Num;
  "Profit Factor": Num;
  "Avg Trade %": Num;
  "% of Total Trades": Num;
  "% of Total Net P&L": Num;
}

export interface SymbolScorecardRow {
  Symbol: string;
  Sector: string | null;
  "Market Cap": string | null;
  Trades: Num;
  Wins: Num;
  Losses: Num;
  "Win Rate %": Num;
  "Net P&L (Rs)": Num;
  "Gross Profit (Rs)": Num;
  "Gross Loss (Rs)": Num;
  "Total Charges (Rs)": Num;
  "Profit Factor": Num;
  "Avg Trade %": Num;
  "Best Trade %": Num;
  "Worst Trade %": Num;
  "Avg Hold (weeks)": Num;
  "First Entry": string | null;
  "Last Exit": string | null;
  "Sharpe Ratio": Num;
  Verdict: Verdict;
}

export interface TradeLogRow {
  "#": Num;
  Symbol: string;
  Sector: string | null;
  "Market Cap": string | null;
  "Entry Date": string | null;
  "Exit Date": string | null;
  "Duration (weeks)": Num;
  "Entry Price": Num;
  "Exit Price": Num;
  Size: Num;
  "P&L (Rs)": Num;
  "Return (%)": Num;
  "Entry Reason": string | null;
  "Exit Reason": string | null;
}

export interface ReportDoc {
  status: DocStatus | null;
  supersedes: string | null;
  date: string | null;
  body: string | null; // raw markdown, rendered as-is
}

export type MetricRow = { label: string; value: string; tone?: "pos" | "neg"; hint?: string; title?: string };
export type MetricGroup = { title: string; desc: string; rows: MetricRow[] };

export const NA = "Not available";
export const inr = (n: Num) =>
  n == null ? NA : n.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
export const pct = (n: Num, d = 2) => (n == null ? NA : `${n > 0 ? "+" : ""}${n.toFixed(d)}%`);
export const num = (n: Num, d = 2) => (n == null ? NA : n.toFixed(d));
export const int = (n: Num) => (n == null ? NA : n.toLocaleString("en-IN"));
export const weeks = (n: Num) => (n == null ? NA : `${n.toFixed(1)}w`);
