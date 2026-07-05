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

export interface DashboardResponse {
  portfolio: DashboardPortfolio;
  funds: DashboardFunds;
  positions: DashboardPositions;
  tradeStats: DashboardTradeStats;
  recentTrades: DashboardRecentTrade[];
  pnlChart: DashboardPnlPoint[];
  setups: DashboardSetup[];
  mutualFunds: DashboardMutualFunds;
}
