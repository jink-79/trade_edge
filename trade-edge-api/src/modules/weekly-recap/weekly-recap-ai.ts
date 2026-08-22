import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../config/env";
import type {
  WeeklyRecapEntryRow,
  WeeklyRecapExitRow,
  WeeklyRecapStats,
} from "./weekly-recap.types";

export interface WeeklyRecapAiContext {
  stats: WeeklyRecapStats;
  entries: WeeklyRecapEntryRow[];
  exits: WeeklyRecapExitRow[];
}

/**
 * Narrative recap of the week's trading, generated from numbers already
 * computed server-side — same non-grounded Gemini construction as
 * journal.exit-ai.ts / journal.trade-insight.ts, nothing invented.
 */
export async function fetchWeeklyRecapSummary(ctx: WeeklyRecapAiContext): Promise<string> {
  if (!env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: env.GEMINI_MODEL });

  const fmtPnl = (n: number) => `${n >= 0 ? "+" : ""}₹${n}`;

  const entryLines =
    ctx.entries
      .map((e) => `- ${e.symbol}: bought ${e.quantity} @ ₹${e.price} on ${e.date.slice(0, 10)}`)
      .join("\n") || "None";
  const exitLines =
    ctx.exits
      .map(
        (e) =>
          `- ${e.symbol}: closed @ ₹${e.price} on ${e.date.slice(0, 10)}, ${e.outcome}, ${fmtPnl(e.pnl)}`,
      )
      .join("\n") || "None";

  const prompt =
    `Write a short weekly trading recap (120-160 words, plain text, no markdown, ` +
    `address the trader as "you") using ONLY the facts below — don't invent price ` +
    `context, news, or anything not listed.\n\n` +
    `Week: ${ctx.stats.weekStart.slice(0, 10)} to ${ctx.stats.weekEnd.slice(0, 10)}\n` +
    `Net P&L this week: ${fmtPnl(ctx.stats.netPnl)}\n` +
    `Win rate: ${ctx.stats.winRate}% (${ctx.stats.exitsCount} closed trades)\n` +
    `Best trade: ${ctx.stats.bestTrade ? `${ctx.stats.bestTrade.symbol} (${fmtPnl(ctx.stats.bestTrade.pnl)})` : "none"}\n` +
    `Worst trade: ${ctx.stats.worstTrade ? `${ctx.stats.worstTrade.symbol} (${fmtPnl(ctx.stats.worstTrade.pnl)})` : "none"}\n` +
    `Open positions: ${ctx.stats.openPositionsCount}, unrealized P&L ₹${ctx.stats.openUnrealizedPnl}\n\n` +
    `Entries this week:\n${entryLines}\n\n` +
    `Exits this week:\n${exitLines}\n\n` +
    `Summarize how the week went and end with one concrete, specific thing to watch or improve next week. ` +
    `If nothing happened this week (no entries or exits), say so plainly instead of padding.`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}
