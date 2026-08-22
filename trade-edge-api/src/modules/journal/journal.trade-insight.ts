import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../config/env";
import type { EntryAdherenceCheck, ExitAdherenceCheck } from "./journal.rule-check";

export interface TradeInsightContext {
  symbol: string;
  sector: string | null;
  marketCapCategory: string | null;
  entryDate: string;
  entryPrice: number;
  quantity: number;
  rs55AtEntry: number | null;
  distanceFrom200Ema: number;
  distanceTo50Ema: number;
  niftyRegimeAtEntry: "up" | "down";
  entryCheck: EntryAdherenceCheck;
  exitDate: string;
  exitPrice: number;
  outcome: string;
  daysHeld: number;
  exitCheck: ExitAdherenceCheck;
  grossPnlPct: number;
  netPnlAmount: number;
  totalCharges: number;
  manualNote: string | null;
}

function describeEntry(c: EntryAdherenceCheck): string {
  if (!c.signalFound) return "no daily_signals record exists for that date — can't verify";
  if (c.inToBuy) return "confirmed: the system sized this as a real buy that day";
  if (c.inCandidates) return "the system ranked this as a buy candidate that day but didn't size it (e.g. no free slot) — a discretionary override to take it anyway";
  return "the system did NOT flag this symbol as a buy candidate that day at all — a fully discretionary entry outside the system's own scan";
}

function describeExit(c: ExitAdherenceCheck): string {
  if (!c.signalFound) return "no daily_signals record exists for that date — can't verify";
  if (c.inExits) return "confirmed: the system's own scan flagged this symbol's trend as flipped down that day";
  return "the system's scan did NOT flag this symbol for exit that day — this was a discretionary exit ahead of (or without) an actual trend-flip signal";
}

/**
 * Comprehensive post-trade review against the Trend+RS-55 system's own
 * rules (entry: trend flip up + RS-55 > 0; exit: trend flip down only, no
 * fixed stop/target) — same non-grounded Gemini construction as
 * journal.exit-ai.ts / journal.ai-review.ts, but every fact fed into the
 * prompt is either a number already computed server-side or a verified
 * true/false from phalanx-live's own daily_signals record, never invented.
 */
export async function fetchTradeInsight(ctx: TradeInsightContext): Promise<string> {
  if (!env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: env.GEMINI_MODEL });

  const positive = ctx.netPnlAmount >= 0;

  const prompt =
    `You're reviewing one closed trade against a mechanical trend-following system's own rules. ` +
    `Use ONLY the facts below — don't invent price context, news, or anything not listed.\n\n` +
    `SYSTEM RULES:\n` +
    `- Entry: only when the daily trend flips up AND RS-55 (55-session return vs Nifty) is positive. No discretion intended.\n` +
    `- Exit: only when the daily trend flips back down. No fixed stop-loss or profit target — the system is designed to hold through the full trend cycle either way.\n\n` +
    `TRADE:\n` +
    `Symbol: ${ctx.symbol} (${ctx.sector || "sector unknown"}${ctx.marketCapCategory ? `, ${ctx.marketCapCategory}` : ""})\n` +
    `Entry: ${ctx.entryDate.slice(0, 10)} @ ₹${ctx.entryPrice}, qty ${ctx.quantity}\n` +
    `RS-55 at entry: ${ctx.rs55AtEntry != null ? `${ctx.rs55AtEntry.toFixed(2)}%` : "unavailable"}\n` +
    `Distance from 200 EMA at entry: ${ctx.distanceFrom200Ema.toFixed(2)}%, from 50 EMA: ${ctx.distanceTo50Ema.toFixed(2)}%\n` +
    `Nifty regime at entry: ${ctx.niftyRegimeAtEntry === "up" ? "up-trend" : "down-trend"}\n` +
    `Entry verification (from the system's own daily scan): ${describeEntry(ctx.entryCheck)}\n\n` +
    `Exit: ${ctx.exitDate.slice(0, 10)} @ ₹${ctx.exitPrice}, outcome "${ctx.outcome}", held ${ctx.daysHeld} day(s)\n` +
    `Exit verification (from the system's own daily scan): ${describeExit(ctx.exitCheck)}\n\n` +
    `Result: ${positive ? "+" : ""}${ctx.grossPnlPct.toFixed(2)}% gross, net ₹${ctx.netPnlAmount} after ~₹${ctx.totalCharges} charges\n` +
    (ctx.manualNote ? `Trader's own note: ${ctx.manualNote}\n` : "") +
    `\nWrite a comprehensive but concise review (150-200 words, plain text, no markdown) covering, in order:\n` +
    `1. Was the entry actually system-aligned, per the verification above?\n` +
    `2. Was the exit actually system-aligned, per the verification above, or discretionary/early/late?\n` +
    `3. What, if anything, could have been done better here?\n` +
    `4. One concrete, specific takeaway for next time.`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}
