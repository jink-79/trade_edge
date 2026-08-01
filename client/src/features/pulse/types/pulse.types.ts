// Shapes posted by the pulse_trader courier (see docs/architecture/pulse-weekly.md).
// All *Pct metrics are human numbers (18.62 == 18.62%).

export interface PulseMetrics {
  returnPct: number | null;
  cagrPct: number | null;
  niftyCagrPct: number | null;
  alphaPct: number | null;
  maxDrawdownPct: number | null;
  avgDrawdownPct: number | null;
  maxDrawdownWeeks: number | null;
  volatilityPct: number | null;
  sharpe: number | null;
  sortino: number | null;
  calmar: number | null;
  profitFactor: number | null;
  trades: number | null;
  winRatePct: number | null;
  bestTradePct: number | null;
  worstTradePct: number | null;
  avgWinPct: number | null;
  avgLossPct: number | null;
  expectancyPct: number | null;
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
