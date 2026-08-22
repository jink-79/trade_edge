/* ─────────────────────────────────────────────────────
   DATA CONTRACT — GET /api/dashboard
   Composed server-side from funds, positions, trades, mutual funds.
───────────────────────────────────────────────────── */

export interface DashboardPortfolio {
  totalFundsDeposited: number;
  totalOpenInvested: number;
  totalMfInvested: number;
  totalNetPnl: number;
  totalValue: number;
}

export interface DashboardFunds {
  totalDeposited: number;
  byType: Record<string, number>;
}

export interface DashboardPositions {
  openCount: number;
  totalInvested: number;
  breakdown: { long: number; short: number };
}

export interface DashboardTradeStats {
  totalTrades: number;
  winRate: number;
  netPnl: number;
  profitFactor: number;
  avgHold: string;
}

export interface DashboardRecentTrade {
  id: string;
  symbol: string;
  exitDate: string;
  pnlAmount: number;
  pnlPercent: number;
  exitReason: string;
}

export interface DashboardPnlPoint {
  month: string;
  pnl: number;
  cumulative: number;
}

export interface DashboardSetup {
  setup: string;
  trades: number;
  winRate: number;
  avgPnl: number;
}

export interface DashboardMutualFunds {
  totalInvested: number;
  totalEntries: number;
  byCategory: Record<string, number>;
}

/* ── Behavioral / trade-quality insights ── */

export interface DashboardMfeCapture {
  avgCapturePct: number | null;
  sampleSize: number;
}

export interface DashboardExpectancy {
  winRate: number;
  avgWin: number;
  avgLoss: number;
  expectancyPerTrade: number;
  avgWinR: number | null;
  avgLossR: number | null;
  expectancyR: number | null;
}

export interface DashboardStreak {
  current: number;
  bestWinStreak: number;
  worstLossStreak: number;
}

export interface DashboardRMultipleBucket {
  label: string;
  count: number;
}

export interface DashboardSegmentStats {
  trades: number;
  winRate: number;
  avgPnl: number;
}

export interface DashboardSegmentedPerformance {
  ruleAdherence: {
    system: DashboardSegmentStats | null;
    discretionary: DashboardSegmentStats | null;
  };
  regime: {
    up: DashboardSegmentStats | null;
    down: DashboardSegmentStats | null;
  };
}

export interface DashboardSectorConcentration {
  sector: string;
  invested: number;
  pct: number;
}

export interface DashboardInsights {
  mfeCapture: DashboardMfeCapture;
  expectancy: DashboardExpectancy;
  streak: DashboardStreak;
  rMultipleBuckets: DashboardRMultipleBucket[];
  segmented: DashboardSegmentedPerformance;
  sectorConcentration: DashboardSectorConcentration[];
}

export interface DashboardResponse {
  portfolio: DashboardPortfolio;
  funds: DashboardFunds;
  positions: DashboardPositions;
  tradeStats: DashboardTradeStats;
  recentTrades: DashboardRecentTrade[];
  pnlChart: DashboardPnlPoint[];
  setups: DashboardSetup[];
  mutualFunds: DashboardMutualFunds;
  insights: DashboardInsights;
}
