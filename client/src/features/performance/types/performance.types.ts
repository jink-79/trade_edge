export interface BacktestMetrics {
  // returns (fractions, e.g. 0.12 = 12%)
  totalReturn: number | null;
  cagr: number | null;
  buyHoldEqualWeight: number | null;
  niftyCagr: number | null;
  alphaVsNifty: number | null;
  tradesPerYear: number | null;
  // risk
  maxDrawdown: number | null;
  avgDrawdown: number | null;
  maxDrawdownDurationDays: number | null;
  volatilityAnnualized: number | null;
  // ratios
  sharpe: number | null;
  sortino: number | null;
  calmar: number | null;
  profitFactor: number | null;
  rr: number | null;
  // trade stats
  totalTrades: number | null;
  winRate: number | null; // already 0–100
  lossRate: number | null;
  bestTradeR: number | null;
  worstTradeR: number | null;
  avgTradeDurationDays: number | null;
  avgWinR: number | null;
  avgLossR: number | null;
  expectancyR: number | null;
  longestLosingStreak: number | null;
  maxConsecutiveWins: number | null;
  oosIsRatio: number | null;
}

export interface EquityPoint {
  date: string;
  equity: number | null;
}
export interface MonthlyReturn {
  month: string;
  ret: number | null;
}
export interface BenchmarkPoint {
  date: string;
  value: number | null;
}

export interface Performance {
  asOf: string;
  computedAt: string;
  config: {
    startingCapital?: number;
    riskPerTrade?: number;
    benchmark?: string;
    concurrency?: string;
  } | null;
  metrics: BacktestMetrics | null;
  equityCurve: EquityPoint[];
  monthlyReturns: MonthlyReturn[];
  benchmarkCurve: BenchmarkPoint[];
  tradeCount: number;
  sampleWarning: string | null;
}
