export type SignalStatus = "OPEN" | "TARGET" | "STOP" | "TIMEOUT";

export interface SignalEntry {
  entryDate: string;
  entryPrice: number;
  atr14: number;
  targetPrice: number;
  stopPrice: number;
  rsi2: number;
  distanceFrom200Ema: number;
  distanceTo50Ema: number;
  pullbackDepth: number;
  candlesFromHigh: number;
  entryCandleClose: string;
  downMoveVolume: string;
  sector: string;
  niftyVs200Ema: string;
  niftyRsi2: number;
  gappedIntoEntry: boolean;
}

export interface SignalTracking {
  lastPrice: number;
  lastDate: string;
  mae: number;
  mfe: number;
  daysHeld: number;
}

export interface SignalResult {
  outcome: SignalStatus;
  exitPrice: number;
  exitDate: string;
  daysToResolve: number;
  rMultiple: number | null;
  maeR: number | null;
  mfeR: number | null;
}

export interface ScannerSignal {
  id: string;
  batchId: string | null;
  symbol: string;
  scanDate: string;
  sector: string | null;
  marketCap: string | null;
  status: SignalStatus;
  entry: SignalEntry | null;
  tracking: SignalTracking | null;
  result: SignalResult | null;
  createdAt: string;
  updatedAt: string;
}

export interface ScannerStats {
  total: number;
  open: number;
  resolved: number;
  targetPct: number;
  stopPct: number;
  timeoutPct: number;
  winRate: number;
  avgR: number | null;
  expectancy: number | null;
  avgDaysToResolve: number;
}

export interface CreateBatchPayload {
  scanDate: string;
  symbols: string[];
  scanName?: string;
  rawInput?: string;
  note?: string;
}

export interface CreateBatchResult {
  batchId: string;
  scanDate: string;
  symbols: number;
  tracked: number;
}

export interface UploadRow {
  scanDate: string; // YYYY-MM-DD
  symbol: string;
  sector?: string;
  marketCap?: string;
}

export interface UploadResult {
  batchId: string;
  rows: number;
  dates: number;
  symbols: number;
  newSignals: number;
  tracked: number;
}
