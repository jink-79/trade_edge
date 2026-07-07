/* ─────────────────────────────────────────────────────
   DATA CONTRACT  —  matches trade-edge-api /api/positions
   ─────────────────────────────────────────────────────

   GET  /api/positions            → ApiEnvelope<Position[]>
   POST /api/positions            → ApiEnvelope<Position>
   (positions are a manual open-position log — no live market data)
───────────────────────────────────────────────────── */

export type PositionSide = "long" | "short";
export type Timeframe = "daily" | "weekly" | "monthly";

/** Server shape (backend sends `id`; UI keys on `_id`). */
export interface Position {
  _id: string;
  stockName: string;
  stockSymbol: string;
  sector: string;
  tradeDate: string; // ISO
  side: PositionSide;
  entryPrice: number;
  quantity: number;
  investedAmount: number; // entryPrice * quantity — computed server-side
  timeframe: Timeframe;
  notes?: string;
  // ── Weekly market snapshot (null until the Python sync script runs) ──
  lastClosedWeeklyClose: number | null; // latest weekly close (LTP proxy)
  highestCloseSinceEntry: number | null;
  structureExitLow: number | null;
  trailingActive: boolean;
  trailingStopPrice: number | null;
  trailActivatedDate: string | null;
  exitSignal: boolean;
  exitReason: string | null;
  lastCandleDate: string | null;
  pnlPercent: number | null;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Client-enriched shape (derived fields added in use-positions.ts).
 *  Market-derived fields are null until the position has been synced. */
export interface EnrichedPosition extends Position {
  holdingDays: number;
  hasMarketData: boolean; // true once the sync script has populated a close
  currentPrice: number | null;
  currentValue: number | null;
  pnlAbs: number | null;
  pnlPct: number | null;
  riskToStop: number | null; // % from current price to the active stop
  upsideFromHigh: number | null; // drawdown from highest close (%)
}

export interface CreatePositionPayload {
  stockName: string;
  stockSymbol: string;
  sector: string;
  tradeDate: string; // ISO
  side: PositionSide;
  entryPrice: number;
  quantity: number;
  timeframe: Timeframe;
  notes?: string;
}

export interface ExitPositionPayload {
  exitPrice: number;
  charges: number;
  exitReason: string;
  notes?: string;
  exitDate?: string;
}

export interface ExitResult {
  id: string;
  symbol: string;
  pnlAmount: number;
  pnlPercent: number;
  holdingDays: number;
}

export interface PositionsSummary {
  totalPositions: number;
  totalInvested: number;
  longCount: number;
  shortCount: number;
  avgHold: number; // days
  sectorCount: number;
  // ── market-derived (only over synced positions) ──
  syncedCount: number; // how many have a weekly snapshot
  totalPnl: number; // unrealised, across synced positions
  totalPnlPct: number; // relative to invested of synced positions
  trailCount: number;
  signalCount: number;
}

export type SortCol =
  | "tradeDate"
  | "entryPrice"
  | "quantity"
  | "investedAmount"
  | "holdingDays";

export interface SortState {
  col: SortCol;
  dir: "asc" | "desc";
}

export type FilterKey = "all" | "long" | "short";
