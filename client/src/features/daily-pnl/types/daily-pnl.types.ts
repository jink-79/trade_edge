export interface DailyPnlPosition {
  symbol: string;
  quantity: number;
  entryPrice: number;
  markPrice: number | null;
  unrealizedPnl: number;
}

export interface DailyPnlClosedTrade {
  symbol: string;
  exitPrice: number;
  pnlAmount: number;
}

export interface DailyPnlSnapshot {
  date: string;
  openPositions: DailyPnlPosition[];
  unrealizedPnlTotal: number;
  closedToday: DailyPnlClosedTrade[];
  realizedPnlTotal: number;
  totalPnl: number;
  availableCash: number;
  generatedAt: string;
}
