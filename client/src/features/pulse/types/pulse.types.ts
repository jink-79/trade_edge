// Shapes posted by the pulse_trader courier (see docs/architecture/pulse-weekly.md).
// All *Pct metrics are human numbers (18.62 == 18.62%).
//
// Mirrors trade-edge-api's shared BacktestMetricsSchema (src/modules/reports)
// — see strategies/S001_pulse_breaker/BACKTEST_REPORT_SCHEMA.md. `returnPct`/
// `trades` are the courier's CURRENT field names; `totalReturnPct`/`totalTrades`
// are the schema doc's names for the same numbers — read both (old first,
// schema-doc name as the fallback) until the courier is updated to emit the
// newer names. Every field the courier doesn't send yet (SQN, Kelly %,
// streaks, holding period, execution, distribution, sector/cap breakdown) is
// simply absent/null until pulse_trader's compute side catches up.
export interface PulseMetrics {
  returnPct: number | null;
  totalReturnPct: number | null;
  cagrPct: number | null;
  netProfit: number | null;
  avgAnnualReturnPct: number | null;
  avgMonthlyReturnPct: number | null;
  niftyCagrPct: number | null;
  alphaPct: number | null;

  maxDrawdownPct: number | null;
  avgDrawdownPct: number | null;
  maxDrawdownWeeks: number | null;
  recoveryWeeks: number | null;
  volatilityPct: number | null;
  ulcerIndex: number | null;

  sharpe: number | null;
  sortino: number | null;
  calmar: number | null;

  trades: number | null;
  totalTrades: number | null;
  winningTrades: number | null;
  losingTrades: number | null;
  winRatePct: number | null;
  lossRatePct: number | null;

  profitFactor: number | null;
  expectancyPct: number | null;
  medianTradePct: number | null;
  avgWinPct: number | null;
  avgLossPct: number | null;
  rewardRiskRatio: number | null;

  bestTradePct: number | null;
  worstTradePct: number | null;
  largestWinRs: number | null;
  largestLossRs: number | null;
  top10WinnersContributionPct: number | null;
  top10LosersContributionPct: number | null;

  maxWinStreak: number | null;
  maxLossStreak: number | null;
  avgWinStreak: number | null;
  avgLossStreak: number | null;

  avgHoldWeeks: number | null;
  medianHoldWeeks: number | null;
  maxHoldWeeks: number | null;
  minHoldWeeks: number | null;
  avgWinningHoldWeeks: number | null;
  avgLosingHoldWeeks: number | null;

  avgPositionSizeRs: number | null;
  avgPositionCountExposure: number | null;
  avgCapitalUtilizationPct: number | null;
  cashIdlePct: number | null;
  maxConcurrentPositions: number | null;

  timeInMarketPct: number | null;
  tradesPerYear: number | null;
  tradesPerMonth: number | null;

  equityCurveR2: number | null;

  portfolioVolatilityPct: number | null;
  tradeReturnStdDevPct: number | null;
  tradeReturnSkew: number | null;
  tradeReturnKurtosis: number | null;
  profitableMonthsPct: number | null;

  bestMonthPct: number | null;
  worstMonthPct: number | null;
  bestYearPct: number | null;
  worstYearPct: number | null;
  positiveYearsPct: number | null;

  sqn: number | null;
  kellyPct: number | null;

  avgTradesPerSymbol: number | null;
  sectorBreakdown: GroupBreakdownRow[];
  marketCapBreakdown: GroupBreakdownRow[];
}

export interface GroupBreakdownRow {
  Group: string;
  Trades: number | null;
  "Win Rate %": number | null;
  "Net P&L (Rs)": number | null;
  "Profit Factor": number | null;
  "Avg Trade %": number | null;
  "% of Total Trades": number | null;
  "% of Total Net P&L": number | null;
}

export interface EquityPoint {
  date: string;
  equity: number | null;
}
export interface BenchmarkPoint {
  date: string;
  value: number | null;
}
export interface MonthlyReturn {
  month: string;
  ret: number | null;
}

export interface PulsePerformance {
  variant: string;
  label: string | null;
  asOf: string | null;
  config: Record<string, unknown> | null;
  metrics: PulseMetrics | null;
  equityCurve: EquityPoint[];
  monthlyReturns: MonthlyReturn[];
  benchmarkCurve: BenchmarkPoint[];
  tradeCount: number;
  sampleWarning: string | null;
}

export interface PulseCandidate {
  rank: number;
  symbol: string;
  rs55: number | null;
  atr: number | null;
  close: number | null;
  sector: string | null;
  marketCap: string | null;
  signalDate: string | null;
  taken: boolean;
  shares: number | null;
  estEntry: number | null;
  estSl: number | null;
  estTarget: number | null;
  estCost: number | null;
}

export interface PulseExit {
  symbol: string;
  reason: string;
  close: number | null;
  shares: number | null;
  entryPrice: number | null;
  slPrice: number | null;
  tpPrice: number | null;
  weeksHeld: number | null;
  entryDate: string | null;
}

export interface PulseRun {
  variant: string;
  asOf: string;
  universe: string | null;
  universeSize: number;
  symbolsWithData: number;
  openPositions: number;
  freeSlots: number;
  equity: number;
  cash: number;
  exits: PulseExit[];
  candidates: PulseCandidate[];
}

// ── Weekly Results blotter (the by-date view) ────────────────────────────────
export interface PulseWeekCounts {
  new: number;
  open: number;
  exits: number;
}

export interface PulseWeekSummary {
  week: string;
  variant?: string;
  equity: number;
  cash: number;
  realizedPnl: number;
  unrealizedPnl: number;
  openValue: number;
  counts: PulseWeekCounts | null;
}

export type PulseRowStatus = "new" | "open" | "exited";

export interface PulseWeekRow {
  symbol: string;
  status: PulseRowStatus;
  entryDate: string;
  entryPrice: number;
  shares: number;
  sector: string | null;
  marketCap: string | null;
  rs: number | null;
  stop: number | null;
  target: number | null;
  markPrice: number;
  pnl: number;
  returnPct: number;
  weeksHeld: number;
  exitReason: string | null;
}

export interface PulseSignalOutcome {
  symbol: string;
  rs: number | null;
  sector: string | null;
  marketCap: string | null;
  taken: boolean;
  entryPrice: number;
  outcomeStatus: "open" | "target" | "stop";
  exitDate: string | null;
  exitPrice: number;
  returnPct: number;
  pnlNotional: number;
  weeksHeld: number;
}

export interface PulseWeek extends PulseWeekSummary {
  rows: PulseWeekRow[];
  allSignals: PulseSignalOutcome[];
}

// ── Symbol Scorecard (per-symbol v10 backtest breakdown) ────────────────────
export type ScorecardVerdict = "KEEP" | "REVIEW" | "ELIMINATE" | "TOO FEW TRADES";
export type ScorecardUniverse = "tracked" | "fno";

export interface SymbolScorecardRow {
  Symbol: string;
  Trades: number;
  Wins: number;
  Losses: number;
  "Win Rate %": number;
  "Net P&L (Rs)": number;
  "Gross Profit (Rs)": number;
  "Gross Loss (Rs)": number;
  "Total Charges (Rs)": number;
  "Profit Factor": number | null; // null == infinite (zero losing trades)
  "Avg Trade %": number;
  "Best Trade %": number;
  "Worst Trade %": number;
  "Avg Hold (weeks)": number;
  "First Entry": string;
  "Last Exit": string;
  "Sharpe Ratio": number;
  Verdict: ScorecardVerdict;
}

export interface SymbolScorecardSnapshot {
  strategy: string;
  variant: ScorecardUniverse;
  universeSize: number;
  symbolsWithData: number;
  periodStart: string | null;
  periodEnd: string | null;
  generatedAt: string;
  symbols: SymbolScorecardRow[];
}
