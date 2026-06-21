/* ─────────────────────────────────────────────────────
   DATA CONTRACT
   ─────────────────────────────────────────────────────

   GET /api/signals?week=2026-06-16
   ↳ week param = Monday of the ISO week (YYYY-MM-DD)

   Response:
   {
     success: boolean
     weekStart: string          // "2026-06-16"
     niftyAboveEma: boolean     // 20-week EMA filter result
     niftyClose: number         // Nifty closing price used
     niftyEma20w: number        // EMA value
     totalScanned: number       // symbols scanned that week
     data: Signal[]
   }

   GET /api/signals/weeks
   ↳ Returns list of available weeks (last 8)
   Response: { weeks: WeekMeta[] }
───────────────────────────────────────────────────── */

export type SignalStatus = "active" | "target_hit" | "stopped_out" | "expired";
export type SignalStrength = "strong" | "moderate" | "weak";

export interface Signal {
  _id: string;
  symbol: string;
  stockName: string;
  sector: string;
  weekStart: string; // ISO — Monday of signal week

  // PULSE BREAKER core fields
  breakoutHigh: number; // 2-candle range high
  breakoutLow: number; // 2-candle range low
  entryPrice: number; // next candle open (suggested entry)
  stopLoss: number; // structureExitLow
  targetPrice: number; // trail activation level (+6%)

  // Volume & filters
  volumeRatio: number; // actual / avg (>= 1.3 to qualify)
  niftyFilterPass: boolean; // Nifty above 20W EMA at signal time

  // Signal quality — derived field, computed by backend
  strength: SignalStrength;

  // Outcome — null while open, populated on close
  status: SignalStatus;
  outcomePercent: number | null;
  exitDate: string | null;

  createdAt: string;
}

export interface WeekMeta {
  weekStart: string; // "2026-06-16"
  weekLabel: string; // "16 Jun – 20 Jun"
  signalCount: number;
  niftyAboveEma: boolean;
}

export interface SignalsWeekResponse {
  success: boolean;
  weekStart: string;
  niftyAboveEma: boolean;
  niftyClose: number;
  niftyEma20w: number;
  totalScanned: number;
  data: Signal[];
}

export interface WeeksListResponse {
  weeks: WeekMeta[];
}

export interface SortState {
  col: keyof Signal | "riskReward";
  dir: "asc" | "desc";
}
