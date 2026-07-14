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
}
