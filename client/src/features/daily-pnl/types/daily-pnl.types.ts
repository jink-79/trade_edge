export interface DailyPnlPosition {
  id: string | null;
  symbol: string;
  quantity: number;
  entryPrice: number;
  markPrice: number | null;
  unrealizedPnl: number;
  /** Day-over-day move (today's mark vs yesterday's close) — distinct from
   * unrealizedPnl, which is since-entry. Null with no prior close yet. */
  todayPnl: number | null;
}

export interface DailyPnlClosedTrade {
  id: string | null;
  symbol: string;
  exitPrice: number;
  pnlAmount: number;
}

export interface DailyPnlSnapshot {
  date: string;
  openPositions: DailyPnlPosition[];
  unrealizedPnlTotal: number;
  /** Sum of todayPnl across open positions. */
  todayPnlTotal: number;
  closedToday: DailyPnlClosedTrade[];
  realizedPnlTotal: number;
  totalPnl: number;
  availableCash: number;
  generatedAt: string;
}
