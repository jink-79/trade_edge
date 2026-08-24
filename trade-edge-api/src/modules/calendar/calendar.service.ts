import { JournalOpen, JournalClosed } from "../journal/journal.model";
import { getCandleWindow } from "../../config/phalanx-ohlcv";
import {
  BENCHMARK_INDICES,
  type CalendarEvent,
  type CalendarResponse,
  type CalendarBenchmarkResponse,
  type CalendarDayBenchmark,
} from "./calendar.types";

const round2 = (n: number) => Math.round(n * 100) / 100;

function fmtPrice(n: number): string {
  return (
    "₹" +
    n.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
      minimumFractionDigits: n % 1 === 0 ? 0 : 2,
    })
  );
}

/** Net P&L when charges were tracked; falls back to gross for trades closed
 * before charges tracking existed — same convention as the dashboard. */
function netPnlFor(t: any): number {
  return t.netPnlAmount ?? t.pnlAmount ?? 0;
}

/**
 * Every entry and exit that landed in the given month, across open + closed
 * trades. `month` is 0-indexed to match JS Date / the frontend's cursor.
 */
export async function getCalendarEvents(
  userId: string,
  year: number,
  month: number,
): Promise<CalendarResponse> {
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 1); // exclusive
  const noShots = "-entry.screenshot -exit.screenshot";

  const [openEntries, closedEntries, closedExits] = await Promise.all([
    JournalOpen.find({
      userId,
      "entry.entryDate": { $gte: monthStart, $lt: monthEnd },
    })
      .select(noShots)
      .lean(),
    JournalClosed.find({
      userId,
      "entry.entryDate": { $gte: monthStart, $lt: monthEnd },
    })
      .select(noShots)
      .lean(),
    JournalClosed.find({
      userId,
      "exit.exitDate": { $gte: monthStart, $lt: monthEnd },
    })
      .select(noShots)
      .lean(),
  ]);

  const events: CalendarEvent[] = [];

  for (const t of [...openEntries, ...closedEntries]) {
    const e: any = t.entry;
    if (!e) continue;
    events.push({
      id: `${t._id}-entry`,
      day: new Date(e.entryDate).getDate(),
      kind: "entry",
      symbol: e.ticker,
      title: `Bought ${e.quantity} @ ${fmtPrice(e.entryPrice)}`,
    });
  }

  for (const t of closedExits) {
    const e: any = t.entry;
    const x: any = t.exit;
    if (!e || !x?.exitDate) continue;
    const exitedQty = x.quantity ?? e.quantity;
    events.push({
      id: `${t._id}-exit`,
      day: new Date(x.exitDate).getDate(),
      kind: "exit",
      symbol: e.ticker,
      title: `Sold ${exitedQty} @ ${fmtPrice(x.exitPrice)}`,
      pnl: netPnlFor(t),
      capital: round2(e.entryPrice * exitedQty),
    });
  }

  events.sort((a, b) => a.day - b.day);

  return { year, month, events };
}

/**
 * Day-over-day % return for every benchmark index, for every trading day in
 * the given month — the same basis a day's blended portfolio return
 * (sum(exit pnl) / sum(exit capital)) can be compared against. Not
 * user-scoped: index OHLCV is the same for everyone. `barsBefore = 5` just
 * needs the ONE prior trading day's close to seed day 1's return; a small
 * lead-in survives a long holiday weekend at the start of a month.
 */
export async function getCalendarBenchmarks(
  year: number,
  month: number,
): Promise<CalendarBenchmarkResponse> {
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 1); // exclusive

  const perIndex = await Promise.all(
    BENCHMARK_INDICES.map(async (symbol) => {
      const candles = await getCandleWindow(symbol, monthStart, monthEnd, 5);
      const byDay = new Map<number, number>();
      for (let i = 1; i < candles.length; i++) {
        const c = candles[i];
        const cDate = new Date(c.date);
        if (cDate < monthStart || cDate >= monthEnd) continue;
        const prevClose = candles[i - 1].close;
        if (prevClose <= 0) continue;
        byDay.set(cDate.getDate(), round2(((c.close - prevClose) / prevClose) * 100));
      }
      return { symbol, byDay };
    }),
  );

  const dayMap = new Map<number, CalendarDayBenchmark>();
  for (const { symbol, byDay } of perIndex) {
    for (const [day, pct] of byDay) {
      let entry = dayMap.get(day);
      if (!entry) {
        entry = { day, date: new Date(year, month, day).toISOString(), returns: {} };
        dayMap.set(day, entry);
      }
      entry.returns[symbol] = pct;
    }
  }

  const days = [...dayMap.values()].sort((a, b) => a.day - b.day);
  return { year, month, indices: BENCHMARK_INDICES, days };
}
