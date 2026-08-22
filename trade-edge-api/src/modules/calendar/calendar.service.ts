import { JournalOpen, JournalClosed } from "../journal/journal.model";
import type { CalendarEvent, CalendarResponse } from "./calendar.types";

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
    events.push({
      id: `${t._id}-exit`,
      day: new Date(x.exitDate).getDate(),
      kind: "exit",
      symbol: e.ticker,
      title: `Sold ${x.quantity ?? e.quantity} @ ${fmtPrice(x.exitPrice)}`,
      pnl: netPnlFor(t),
    });
  }

  events.sort((a, b) => a.day - b.day);

  return { year, month, events };
}
