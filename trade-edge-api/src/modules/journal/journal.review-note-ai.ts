import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../config/env";

export interface ReviewNoteContext {
  symbol: string;
  direction: "LONG" | "SHORT";
  entryDate: string;
  entryPrice: number;
  quantity: number;
  isClosed: boolean;
  exitDate: string | null;
  exitPrice: number | null;
  outcome: string;
  /** Existing note text, if any — when present, this is a refine/improve
   * pass over the trader's own words rather than a cold-start draft. */
  existingNote: string | null;
  /** The formal rules-adherence review, if one's already been generated —
   * extra grounding context so the draft doesn't contradict it. */
  tradeInsight: string | null;
}

/**
 * Drafts (or refines) the free-form review note attached to a trade — the
 * always-editable note shown on the trade detail page, distinct from the
 * formal rules-adherence review (journal.trade-insight.ts) and the
 * auto-generated exit summary (journal.exit-ai.ts). Same non-grounded
 * Gemini construction as those: every fact in the prompt is a number
 * already computed server-side, nothing invented.
 */
export async function fetchReviewNoteDraft(ctx: ReviewNoteContext): Promise<string> {
  if (!env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: env.GEMINI_MODEL });

  const facts =
    `Symbol: ${ctx.symbol} (${ctx.direction})\n` +
    `Entry: ${ctx.entryDate.slice(0, 10)} @ ₹${ctx.entryPrice}, qty ${ctx.quantity}\n` +
    (ctx.isClosed
      ? `Exit: ${ctx.exitDate?.slice(0, 10)} @ ₹${ctx.exitPrice}, outcome "${ctx.outcome}"\n`
      : `Status: still open\n`) +
    (ctx.tradeInsight ? `\nExisting formal rules-adherence review:\n${ctx.tradeInsight}\n` : "");

  const prompt = ctx.existingNote
    ? `You're helping a trader refine their own trading journal note. Improve the ` +
      `note below — tighten the writing, keep their voice and every point they ` +
      `made, and add at most one concrete observation if the trade facts suggest ` +
      `something they missed. Don't invent price context, news, or anything not ` +
      `in the facts. Return ONLY the improved note text (first person, plain ` +
      `text, no markdown, no preamble).\n\n` +
      `TRADE FACTS:\n${facts}\n` +
      `THEIR NOTE:\n${ctx.existingNote}`
    : `Draft a short trading journal note (3-5 sentences, first person, plain ` +
      `text, no markdown) for this trade, using ONLY the facts below — don't ` +
      `invent price context, news, or anything not listed. Cover why the setup ` +
      `looked worth taking and, if it's closed, how it played out and one ` +
      `concrete takeaway for next time. If it's still open, note what to watch ` +
      `for instead of a takeaway.\n\n` +
      `TRADE FACTS:\n${facts}`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}
