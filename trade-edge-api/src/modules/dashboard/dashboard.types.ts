// ── Dashboard response type ───────────────────────────────────────────────────
// Single GET /api/dashboard — composed from Funds, Positions, Trades, MutualFunds

/* ── Funds section ── */
export interface DashboardFunds {
  totalDeposited: number; // sum of all fund entries
  byType: Record<string, number>; // trading / emergency / savings / other
}

/* ── Positions section ── */
export interface DashboardPositions {
  openCount: number;
  totalInvested: number; // sum of entryPrice * qty across open positions
  breakdown: {
    // per-side breakdown
    long: number;
    short: number;
  };
}

/* ── Trade stats section ── */
export interface DashboardTradeStats {
  totalTrades: number;
  winRate: number;
  netPnl: number;
  profitFactor: number;
  avgHold: string;
}

/* ── Recent trades ── */
export interface DashboardRecentTrade {
  id: string;
  symbol: string;
  exitDate: string;
  pnlAmount: number;
  pnlPercent: number;
  exitReason: string;
}

/* ── Monthly PnL chart (last 6 months) ── */
export interface DashboardPnlPoint {
  month: string; // "Jan", "Feb" …
  pnl: number;
  cumulative: number; // running cumulative PnL
}

/* ── Top setups (grouped by exit reason) ── */
export interface DashboardSetup {
  setup: string; // exit reason, used as the setup label
  trades: number;
  winRate: number;
  avgPnl: number; // average ₹ P&L per trade in this group
}

/* ── Mutual funds section ── */
export type FundCategory = string;

export interface DashboardMutualFunds {
  totalInvested: number;
  totalEntries: number;
  byCategory: Record<FundCategory, number>;
}

/* ── Portfolio summary ── */
export interface DashboardPortfolio {
  totalFundsDeposited: number;
  totalOpenInvested: number;
  totalMfInvested: number;
  totalNetPnl: number;
  totalValue: number; // totalFundsDeposited + totalNetPnl
}

/* ── Behavioral / trade-quality insights ── */

/** How much of each trade's max favorable move (MFE) was actually
 * captured by the time it exited — the "did I exit too early" number. */
export interface DashboardMfeCapture {
  avgCapturePct: number | null; // null when no closed trade has analytics yet
  sampleSize: number;
}

/** Expectancy — what the system is worth per trade, in both ₹ and R terms,
 * plus the win/loss components that produce it. */
export interface DashboardExpectancy {
  winRate: number;
  avgWin: number;
  avgLoss: number; // positive number (magnitude)
  expectancyPerTrade: number; // ₹, signed
  avgWinR: number | null;
  avgLossR: number | null; // positive number (magnitude)
  expectancyR: number | null;
}

/** Current + historical best/worst win/loss streaks. */
export interface DashboardStreak {
  current: number; // signed: +3 = 3-trade win streak, -2 = 2-trade loss streak
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

/** Closed-trade performance split two ways: did-you-follow-the-signal, and
 * what the index was doing at entry. */
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
  pct: number; // % of total open capital deployed
}

export interface DashboardInsights {
  mfeCapture: DashboardMfeCapture;
  expectancy: DashboardExpectancy;
  streak: DashboardStreak;
  rMultipleBuckets: DashboardRMultipleBucket[];
  segmented: DashboardSegmentedPerformance;
  sectorConcentration: DashboardSectorConcentration[];
}

export interface DashboardStandoutTrade {
  id: string;
  symbol: string;
  pnl: number;
  date: string; // exit date, ISO
}

/** Trade Snapshot — best/worst single trade, hold-time and win/loss
 * averages, both per-trade and per-day. "Day P&L" groups all trades by
 * exit date first (days with more than one exit aren't just one trade's
 * number), then averages across win days vs loss days separately from the
 * per-trade averages. */
export interface DashboardTradeSnapshot {
  highestProfitTrade: DashboardStandoutTrade | null;
  highestLossTrade: DashboardStandoutTrade | null;
  avgTradeTime: string;
  avgTimeInProfitTrade: string;
  avgTimeInLossTrade: string;
  avgWinTrade: number;
  avgWinDayPnl: number;
  avgLossTrade: number; // negative (or 0)
  avgLossDayPnl: number; // negative (or 0)
}

/* ── Full dashboard response ── */
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
  tradeSnapshot: DashboardTradeSnapshot;
}
