import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../config/env";

export interface ExitSummaryContext {
  symbol: string;
  direction: "LONG" | "SHORT";
  entryPrice: number;
  exitPrice: number;
  exitQuantity: number;
  fullQuantity: number;
  holdingDays: number;
  pnlPercent: number;
  netPnlAmount: number;
  totalCharges: number;
  outcome: string;
}

/**
 * Generates the exit "notes" automatically from the trade's own numbers —
 * replaces manual free-text notes. Same non-grounded Gemini construction as
 * journal.ai-review.ts, but the prompt only ever restates numbers we already
 * computed server-side, so there's no live-data/hallucination risk the way
 * a stock briefing has.
 */
export async function fetchExitSummary(ctx: ExitSummaryContext): Promise<string> {
  if (!env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: env.GEMINI_MODEL });

  const isPartial = ctx.exitQuantity < ctx.fullQuantity;
  const positive = ctx.netPnlAmount >= 0;

  const result = await model.generateContent(
    `Write a 2-3 sentence journal note for this closed trade, using ONLY the ` +
      `numbers given below — don't invent news, price context, or anything not ` +
      `listed. Plain factual tone, plain text, no markdown.\n\n` +
      `Symbol: ${ctx.symbol} (${ctx.direction})\n` +
      `Exit type: ${isPartial ? `partial — ${ctx.exitQuantity} of ${ctx.fullQuantity} shares` : "full position"}\n` +
      `Entry: ₹${ctx.entryPrice} → Exit: ₹${ctx.exitPrice}\n` +
      `Held: ${ctx.holdingDays} day(s)\n` +
      `Exit reason: ${ctx.outcome}\n` +
      `Result: ${positive ? "+" : ""}${ctx.pnlPercent.toFixed(2)}% (net ₹${ctx.netPnlAmount} ` +
      `after ~₹${ctx.totalCharges} estimated charges)\n\n` +
      `Summarize the outcome and, if the reason suggests it (e.g. a stop-out or a ` +
      `trend flip), one plain takeaway for next time.`,
  );

  return result.response.text().trim();
}
