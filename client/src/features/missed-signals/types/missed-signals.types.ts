export interface MissedSignal {
  symbol: string;
  date: string;
  entryClose: number;
  latestClose: number | null;
  returnPct: number | null;
}

export interface MissedSignalsResponse {
  since: string;
  days: number;
  totalMissed: number;
  avgReturnPct: number | null;
  bestMissed: MissedSignal | null;
  worstMissed: MissedSignal | null;
  signals: MissedSignal[];
}
