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
  openUnrealizedPnl: number;
}

export interface WeeklyRecapResponse {
  stats: WeeklyRecapStats;
  entries: WeeklyRecapEntryRow[];
  exits: WeeklyRecapExitRow[];
  aiSummary: string | null;
  aiSummaryGeneratedAt: string | null;
}
