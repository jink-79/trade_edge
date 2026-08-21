import { JournalOpen } from "../journal/journal.model";
import { User } from "../auth/auth.model";
import { getTodayAndPrevClose } from "../../config/phalanx-ohlcv";
import { getLatestDailySignal } from "../algo-signals/algo-signals.service";
import { fetchStockUpdate } from "./newsletter.gemini";
import { sendPositionsNewsletter, type PositionUpdate } from "./newsletter.email";
import { NewsletterRun } from "./newsletter.model";
import { logger } from "../../utils/logger";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Today's phalanx-live exit + stale-data symbols — empty sets if Algo
 * Signals isn't configured or hasn't run yet, never a hard failure for the
 * newsletter. Stale matters much more for a HELD symbol (flying blind on a
 * real position) than for a candidate never taken. */
async function getTodaysSignalSets(): Promise<{ exits: Set<string>; stale: Set<string> }> {
  try {
    const doc = await getLatestDailySignal();
    return { exits: new Set(doc?.exits ?? []), stale: new Set(doc?.stale_symbols ?? []) };
  } catch (err) {
    logger.warn(
      `getTodaysSignalSets: could not read daily_signals (${err instanceof Error ? err.message : "unknown error"})`,
    );
    return { exits: new Set(), stale: new Set() };
  }
}

async function buildPositionUpdate(
  trade: any,
  exitSymbols: Set<string>,
  staleSymbols: Set<string>,
): Promise<PositionUpdate> {
  const symbol = trade.symbol as string;
  const entryPrice = trade.entryPrice as number;
  const quantity = trade.quantity as number;

  const { today, prev } = await getTodayAndPrevClose(symbol);
  const todayClose = today?.close ?? null;
  const sinceEntryPct =
    todayClose != null ? round2(((todayClose - entryPrice) / entryPrice) * 100) : null;
  const todayChangePct =
    todayClose != null && prev?.close
      ? round2(((todayClose - prev.close) / prev.close) * 100)
      : null;

  let summary: string;
  try {
    summary = await fetchStockUpdate(symbol);
  } catch (err) {
    summary = `⚠️ Could not fetch a market update for ${symbol} (${
      err instanceof Error ? err.message : "unknown error"
    }).`;
  }

  return {
    symbol,
    quantity,
    entryPrice,
    todayClose,
    sinceEntryPct,
    todayChangePct,
    summary,
    sellSignal: exitSymbols.has(symbol),
    dataStale: staleSymbols.has(symbol),
  };
}

export interface NewsletterRunSummary {
  sent: number;
  failed: number;
  skipped: number;
  sellAlerts: number;
}

/** Groups every user's open trades, builds and sends one newsletter per user
 * who has at least one open position, and logs a NewsletterRun per attempt. */
export async function runDailyNewsletter(): Promise<NewsletterRunSummary> {
  const openTrades = await JournalOpen.find({}).select("userId symbol entryPrice quantity").lean();
  const byUser = new Map<string, any[]>();
  for (const t of openTrades) {
    if (!t.symbol) continue;
    const list = byUser.get(t.userId) ?? [];
    list.push(t);
    byUser.set(t.userId, list);
  }

  const { exits: exitSymbols, stale: staleSymbols } = await getTodaysSignalSets();

  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);

  let sent = 0;
  let failed = 0;
  let skipped = 0;
  let sellAlerts = 0;

  for (const [userId, trades] of byUser) {
    if (trades.length === 0) {
      skipped++;
      await NewsletterRun.create({ userId, date, symbols: [], status: "no_positions" });
      continue;
    }

    const symbols = trades.map((t) => t.symbol);
    try {
      const user = await User.findById(userId).lean();
      if (!user?.email) throw new Error(`No email on file for user ${userId}`);

      const positions = await Promise.all(
        trades.map((t) => buildPositionUpdate(t, exitSymbols, staleSymbols)),
      );
      sellAlerts += positions.filter((p) => p.sellSignal).length;
      await sendPositionsNewsletter(user.email, positions);

      sent++;
      await NewsletterRun.create({
        userId,
        date,
        symbols,
        status: "sent",
        sentAt: new Date(),
      });
    } catch (err) {
      failed++;
      const message = err instanceof Error ? err.message : "unknown error";
      logger.error(`Newsletter failed for user ${userId}:`, err);
      await NewsletterRun.create({ userId, date, symbols, status: "failed", error: message });
    }
  }

  return { sent, failed, skipped, sellAlerts };
}
