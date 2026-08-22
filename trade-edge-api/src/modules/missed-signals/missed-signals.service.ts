import { AppError } from "../../utils/api-error";
import { connectPhalanxDB, isPhalanxConfigured } from "../../config/phalanx-db";
import { DailySignal } from "../algo-signals/algo-signals.model";
import type { DailySignalDoc } from "../algo-signals/algo-signals.types";
import { JournalOpen, JournalClosed } from "../journal/journal.model";
import { getRecentCandles, type PlainCandle } from "../../config/phalanx-ohlcv";
import type { MissedSignal, MissedSignalsResponse } from "./missed-signals.types";

async function ensurePhalanxReady(): Promise<void> {
  if (!isPhalanxConfigured()) {
    throw new AppError(
      "Missed signals isn't configured on this deployment (PHALANX_ATLAS_MONGODB_URI / PHALANX_ATLAS_DB_NAME missing)",
      503,
    );
  }
  await connectPhalanxDB();
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Close on or before `dateStr` (yyyy-mm-dd) — candles are oldest-first. */
function closeOnOrBefore(candles: PlainCandle[], dateStr: string): number | null {
  let best: number | null = null;
  for (const c of candles) {
    if (c.date.slice(0, 10) <= dateStr) best = c.close;
    else break;
  }
  return best;
}

export async function getMissedSignals(userId: string, days: number): Promise<MissedSignalsResponse> {
  await ensurePhalanxReady();

  const clampedDays = Math.min(180, Math.max(7, days));
  const since = new Date();
  since.setDate(since.getDate() - clampedDays);
  const sinceStr = since.toISOString().slice(0, 10);

  const [dailyDocs, openTrades, closedTrades] = await Promise.all([
    DailySignal!
      .find({ reference_date: { $gte: sinceStr } }, { _id: 0 })
      .sort({ reference_date: 1 })
      .lean<DailySignalDoc[]>()
      .exec(),
    JournalOpen.find({ userId }).select("symbol entryDate").lean(),
    JournalClosed.find({ userId }).select("symbol entryDate").lean(),
  ]);

  // Every (symbol, day) you actually entered — a candidate that matches one
  // of these was acted on, not missed.
  const taken = new Set<string>();
  for (const t of [...openTrades, ...closedTrades] as any[]) {
    if (!t.symbol || !t.entryDate) continue;
    const day = new Date(t.entryDate).toISOString().slice(0, 10);
    taken.add(`${t.symbol}|${day}`);
  }

  // Every qualifying candidate (trend flip up + RS-55 > 0, the system's own
  // rules) across the range, minus ones you took.
  const missedRaw: { symbol: string; date: string }[] = [];
  for (const doc of dailyDocs) {
    for (const c of doc.buy_candidates_ranked ?? []) {
      const key = `${c.symbol}|${doc.reference_date}`;
      if (!taken.has(key)) missedRaw.push({ symbol: c.symbol, date: doc.reference_date });
    }
  }

  const uniqueSymbols = [...new Set(missedRaw.map((m) => m.symbol))];
  const candlesBySymbol = new Map<string, PlainCandle[]>();
  const candleDays = Math.max(90, clampedDays + 30);
  await Promise.all(
    uniqueSymbols.map(async (sym) => {
      candlesBySymbol.set(sym, await getRecentCandles(sym, candleDays));
    }),
  );

  const signals: MissedSignal[] = missedRaw
    .map((m) => {
      const candles = candlesBySymbol.get(m.symbol) ?? [];
      const entryClose = closeOnOrBefore(candles, m.date);
      const latestClose = candles.length > 0 ? candles[candles.length - 1].close : null;
      const returnPct =
        entryClose != null && entryClose > 0 && latestClose != null
          ? round2(((latestClose - entryClose) / entryClose) * 100)
          : null;
      return {
        symbol: m.symbol,
        date: m.date,
        entryClose: entryClose ?? 0,
        latestClose,
        returnPct,
      };
    })
    .filter((s) => s.entryClose > 0)
    .sort((a, b) => (b.returnPct ?? -Infinity) - (a.returnPct ?? -Infinity));

  const withReturn = signals.filter((s): s is MissedSignal & { returnPct: number } => s.returnPct != null);
  const avgReturnPct =
    withReturn.length > 0
      ? round2(withReturn.reduce((s, x) => s + x.returnPct, 0) / withReturn.length)
      : null;
  const bestMissed = withReturn.length > 0 ? withReturn.reduce((a, b) => (b.returnPct > a.returnPct ? b : a)) : null;
  const worstMissed = withReturn.length > 0 ? withReturn.reduce((a, b) => (b.returnPct < a.returnPct ? b : a)) : null;

  return {
    since: sinceStr,
    days: clampedDays,
    totalMissed: signals.length,
    avgReturnPct,
    bestMissed,
    worstMissed,
    signals,
  };
}
