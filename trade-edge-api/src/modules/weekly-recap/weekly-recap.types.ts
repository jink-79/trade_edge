// ── Weekly recap response type ────────────────────────────────────────────────
// GET /api/weekly-recap?weekStart=  (weekStart: any date within the target
// week, yyyy-mm-dd — snapped server-side to that week's Monday)

export interface WeeklyRecapEntryRow {
  id: string;
  symbol: string;
  date: string;
  price: number;
  quantity: number;
}

export interface WeeklyRecapExitRow {
  id: string;
  symbol: string;
  date: string;
  price: number;
  pnl: number;
  outcome: string;
}

export interface WeeklyRecapStats {
  weekStart: string;
  weekEnd: string;
  entriesCount: number;
  exitsCount: number;
  netPnl: number;
  winRate: number;
  bestTrade: { symbol: string; pnl: number } | null;
  worstTrade: { symbol: string; pnl: number } | null;
  openPositionsCount: number;
  /** Since-entry unrealized P&L across currently open positions — a
   * portfolio-health figure, not scoped to "this week" specifically. */
  openUnrealizedPnl: number;
}

export interface WeeklyRecapResponse {
  stats: WeeklyRecapStats;
  entries: WeeklyRecapEntryRow[];
  exits: WeeklyRecapExitRow[];
  aiSummary: string | null;
  aiSummaryGeneratedAt: string | null;
}
