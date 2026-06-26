/**
 * DATA CONTRACT
 * Feature: Trade History
 * Description: Interface definitions for reviewing closed trade execution performance metrics, realized profits, losses, and analytics data models.
 */

export type ExitReason =
  | "Target Hit"
  | "Trail Hit"
  | "Stop Hit"
  | "Manual Exit"
  | "Time Exit";

export interface ClosedTrade {
  _id: string;
  symbol: string;
  stockName: string;
  sector: string;
  qty: number;
  entryPrice: number;
  exitPrice: number;
  entryDate: string;
  exitDate: string;
  highestCloseSinceEntry: number;
  structureExitLow: number;
  trailingStopPrice: number | null;
  exitReason: ExitReason;
  pnlPercent: number;
  rMultiple: number;
  thesis: string;
}

export interface EnrichedTrade extends ClosedTrade {
  invested: number;
  exitValue: number;
  pnlAbs: number;
  holdingDays: number;
  captureRatio: number;
}

export type SortCol =
  | "exitDate"
  | "pnlPercent"
  | "pnlAbs"
  | "holdingDays"
  | "rMultiple";

export interface SortState {
  col: SortCol;
  dir: "asc" | "desc";
}

export type FilterKey = "all" | "wins" | "losses" | "target" | "stop";

export interface HistoryKpis {
  totalInvested: number;
  totalPnl: number;
  totalPnlPct: number;
  winRate: number;
  avgHold: number;
  best: EnrichedTrade;
  worst: EnrichedTrade;
  expectancy: number;
  winsCount: number;
  lossesCount: number;
}
