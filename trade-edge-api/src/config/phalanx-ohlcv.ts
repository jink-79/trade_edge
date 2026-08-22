import { phalanxConnection } from "./phalanx-db";

/**
 * Read-only view of phalanx-live's `ohlcv` collection (same cluster/db
 * algo-signals already reads) — daily bars for every symbol it tracks,
 * refreshed every weekday evening by its own GitHub Action. Never written to
 * here. Shared by the newsletter (today's/yesterday's close) and journal's
 * manual-entry + mark-refresh flows (which need a longer window for the
 * ATR/EMA/RS context computations).
 *
 * Uses the raw MongoDB driver (`phalanxConnection.db.collection(...)`)
 * rather than a Mongoose model: an empty/`strict:false` schema bound to a
 * secondary (`createConnection`) connection was observed silently dropping
 * the `.find()` filter — every query returned the same top-N-by-date
 * documents across ALL symbols regardless of the requested symbol. The
 * native driver doesn't have this problem.
 */
export interface OhlcvBar {
  symbol: string;
  timeframe: string;
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

function ohlcvCollection() {
  return phalanxConnection?.db?.collection<OhlcvBar>("ohlcv") ?? null;
}

/** Today's close and the prior trading day's close, for one symbol. Either
 * may be null if there isn't enough history yet. */
export async function getTodayAndPrevClose(
  symbol: string,
): Promise<{ today: OhlcvBar | null; prev: OhlcvBar | null }> {
  const col = ohlcvCollection();
  if (!col) return { today: null, prev: null };
  const bars = await col
    .find({ symbol, timeframe: "daily" })
    .sort({ date: -1 })
    .limit(2)
    .toArray();
  return { today: bars[0] ?? null, prev: bars[1] ?? null };
}

/** A candle in the {date, open, high, low, close, volume} shape journal.compute.ts
 * and journal.types.ts's CandleSchema already expect. */
export interface PlainCandle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/** Up to `days` most recent daily bars for a symbol, oldest first — the
 * window computeEntryIndicators walks to derive ATR/EMA/RS context. */
export async function getRecentCandles(symbol: string, days = 300): Promise<PlainCandle[]> {
  const col = ohlcvCollection();
  if (!col) return [];
  const bars = await col
    .find({ symbol, timeframe: "daily" })
    .sort({ date: -1 })
    .limit(days)
    .toArray();
  return bars
    .reverse()
    .map((b) => ({
      date: new Date(b.date).toISOString(),
      open: b.open,
      high: b.high,
      low: b.low,
      close: b.close,
      volume: b.volume,
    }));
}

/** ~`barsBefore` daily bars leading up to and including entryDate, then every
 * bar through endDate — the window a trade-detail chart wants: enough
 * pre-entry context to see the setup, plus the trade's whole life. Oldest
 * first. */
export async function getCandleWindow(
  symbol: string,
  entryDate: Date | string,
  endDate: Date | string,
  barsBefore = 60,
): Promise<PlainCandle[]> {
  const col = ohlcvCollection();
  if (!col) return [];
  const end = new Date(endDate);
  const bars = await col
    .find({ symbol, timeframe: "daily", date: { $lte: end } })
    .sort({ date: 1 })
    .toArray();
  if (bars.length === 0) return [];

  const entryTime = new Date(entryDate).getTime();
  let entryIdx = bars.findIndex((b) => new Date(b.date).getTime() >= entryTime);
  if (entryIdx === -1) entryIdx = bars.length - 1;

  const start = Math.max(0, entryIdx - barsBefore);
  return bars.slice(start).map((b) => ({
    date: new Date(b.date).toISOString(),
    open: b.open,
    high: b.high,
    low: b.low,
    close: b.close,
    volume: b.volume,
  }));
}

export interface SymbolMeta {
  symbol: string;
  name: string | null;
  sector: string | null;
  marketCapCategory: string | null;
}

function symbolsCollection() {
  return phalanxConnection?.db?.collection("symbols") ?? null;
}

/** phalanx-live's own reference data for a symbol (name/sector/market-cap
 * bucket) — ingested once per symbol, not derived from OHLCV. Null fields
 * when phalanx hasn't backfilled that symbol yet. */
export async function getSymbolMeta(symbol: string): Promise<SymbolMeta | null> {
  const col = symbolsCollection();
  if (!col) return null;
  const doc = await col.findOne({ symbol });
  if (!doc) return null;
  return {
    symbol,
    name: doc.name ?? null,
    sector: doc.sector ?? null,
    marketCapCategory: doc.market_cap_category ?? null,
  };
}
