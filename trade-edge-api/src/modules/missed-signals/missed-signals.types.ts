// ── Missed signal tracker ───────────────────────────────────────────────────
// GET /api/missed-signals?days=  — buy candidates phalanx-live's daily scan
// actually flagged (trend flip up + RS-55 > 0) that you never entered,
// marked to the latest available close so you can see what following every
// signal would have been worth.

export interface MissedSignal {
  symbol: string;
  /** The day this symbol was flagged as a qualifying buy candidate. */
  date: string;
  /** Close price on the flagged date — the entry reference. */
  entryClose: number;
  /** Latest available close — null if phalanx-live has no recent data for
   * this symbol (delisted/untracked). */
  latestClose: number | null;
  /** % move from entryClose to latestClose — null when latestClose is. */
  returnPct: number | null;
}

export interface MissedSignalsResponse {
  since: string; // yyyy-mm-dd
  days: number;
  totalMissed: number;
  avgReturnPct: number | null;
  bestMissed: MissedSignal | null;
  worstMissed: MissedSignal | null;
  signals: MissedSignal[];
}
