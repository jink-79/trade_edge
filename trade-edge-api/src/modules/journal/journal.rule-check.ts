import { listDailySignals } from "../algo-signals/algo-signals.service";
import { logger } from "../../utils/logger";

/** The one daily_signals doc for the calendar day containing `dateIso`, or
 * null if Algo Signals hasn't run for that day (or isn't configured). */
async function findSignalForDate(dateIso: string) {
  try {
    const day = new Date(dateIso);
    const dayStart = new Date(day);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
    const docs = await listDailySignals({
      from: dayStart.toISOString(),
      to: dayEnd.toISOString(),
      limit: 5,
    });
    return docs[0] ?? null;
  } catch (err) {
    logger.warn(
      `findSignalForDate: could not read daily_signals (${err instanceof Error ? err.message : "unknown error"})`,
    );
    return null;
  }
}

export interface EntryAdherenceCheck {
  date: string;
  signalFound: boolean;
  inToBuy?: boolean;
  inCandidates?: boolean;
  wasStale?: boolean;
}

export interface ExitAdherenceCheck {
  date: string;
  signalFound: boolean;
  inExits?: boolean;
  wasStale?: boolean;
}

/** Was this symbol actually flagged by the system's own daily scan on the
 * trade's entry date — sized into `to_buy` (a real, capital-permitting
 * signal), merely ranked in `buy_candidates_ranked` (flagged but not sized,
 * e.g. no free slot that day), or not flagged at all (a discretionary
 * entry the system never generated)? */
export async function checkEntryAdherence(
  symbol: string,
  entryDate: string | Date,
): Promise<EntryAdherenceCheck> {
  const dateIso = new Date(entryDate).toISOString();
  const doc = await findSignalForDate(dateIso);
  if (!doc) return { date: dateIso, signalFound: false };
  return {
    date: dateIso,
    signalFound: true,
    inToBuy: doc.to_buy?.includes(symbol) ?? false,
    inCandidates: doc.buy_candidates_ranked?.some((c) => c.symbol === symbol) ?? false,
    wasStale: doc.stale_symbols?.includes(symbol) ?? false,
  };
}

/** Was this symbol actually flagged in the system's `exits` list on the
 * trade's exit date — the strategy's only real exit signal (a trend flip
 * down)? A MANUAL-EXIT or a TREND-FLIP outcome where the symbol wasn't
 * actually in that day's exits list is a discretionary override. */
export async function checkExitAdherence(
  symbol: string,
  exitDate: string | Date,
): Promise<ExitAdherenceCheck> {
  const dateIso = new Date(exitDate).toISOString();
  const doc = await findSignalForDate(dateIso);
  if (!doc) return { date: dateIso, signalFound: false };
  return {
    date: dateIso,
    signalFound: true,
    inExits: doc.exits?.includes(symbol) ?? false,
    wasStale: doc.stale_symbols?.includes(symbol) ?? false,
  };
}
