/* ─────────────────────────────────────────────────────
   DATA CONTRACT
   ─────────────────────────────────────────────────────

   GET /api/positions
   Response:
   {
     message: string
     count: number
     data: RawPosition[]
   }
───────────────────────────────────────────────────── */

/* ── raw shape from API ── */
export interface RawPosition {
  _id: string;
  stockName: string;
  symbol: string;
  sector: string;
  entryDate: string;
  qty: number;
  entryPrice: number;
  exitReason: string | null;
  exitSignal: boolean;
  highestCloseSinceEntry: number;
  lastCandleDate: string;
  lastClosedWeeklyClose: number;
  pnlPercent: number;
  structureExitLow: number;
  trailActivatedDate: string | null;
  trailingActive: boolean;
  trailingStopPrice: number | null;
  createdAt?: string;
  updatedAt?: string;
}

/* ── client-enriched shape (derived fields added in use-positions.ts) ── */
export interface EnrichedPosition extends RawPosition {
  currentPrice: number;
  invested: number;
  currentValue: number;
  pnlAbs: number;
  riskToStop: number;
  upsideFromHigh: number;
  holdingDays: number;
}

export interface PositionsResponse {
  message: string;
  count: number;
  data: RawPosition[];
}

export interface PositionsSummary {
  totalInvested: number;
  totalCurrent: number;
  totalPnl: number;
  totalPnlPct: number;
  winners: number;
  losers: number;
  trailCount: number;
  signalCount: number;
  avgHold: number;
}

export type FilterKey = "all" | "signal" | "trail" | "clean";

export interface SortState {
  col: keyof EnrichedPosition;
  dir: "asc" | "desc";
}
