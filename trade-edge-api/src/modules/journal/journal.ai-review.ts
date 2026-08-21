import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../config/env";

export interface PositionContext {
  symbol: string;
  entryPrice: number;
  entryDate: Date;
  markPrice: number | null;
  sector: string | null;
  marketCapCategory: string | null;
}

/**
 * On-demand, per-position AI take — same non-grounded Gemini approach as the
 * newsletter's fetchStockUpdate (see newsletter.gemini.ts): no live data, so
 * the prompt explicitly forbids claiming today's price/news, and the caller
 * must present this as a general perspective, not research.
 */
export async function fetchPositionAiReview(p: PositionContext): Promise<string> {
  if (!env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: env.GEMINI_MODEL });

  const holdingDays = Math.max(
    0,
    Math.floor((Date.now() - new Date(p.entryDate).getTime()) / 86_400_000),
  );
  const sinceEntryPct =
    p.markPrice != null ? ((p.markPrice - p.entryPrice) / p.entryPrice) * 100 : null;

  const result = await model.generateContent(
    `You're briefing a trader who is currently HOLDING ${p.symbol}, an NSE-listed ` +
      `(India) stock, bought at ₹${p.entryPrice} ${holdingDays} day(s) ago` +
      (sinceEntryPct != null
        ? `, currently ${sinceEntryPct >= 0 ? "up" : "down"} ${Math.abs(sinceEntryPct).toFixed(1)}% since entry`
        : "") +
      `. Sector: ${p.sector || "unknown"}${p.marketCapCategory ? `, ${p.marketCapCategory}` : ""}. ` +
      `They're running a mechanical trend-following system — entered on a trend flip up, ` +
      `will exit only when the trend flips back down, no fixed target or stop-loss. ` +
      `Give a short 3-4 sentence review: what you know about the company/sector relevant to ` +
      `holding it (business quality, typical volatility, catalysts to watch), and anything ` +
      `worth keeping in mind while riding a full trend cycle. You have no access to live ` +
      `data — do not claim to know today's price, news, or results. Plain text, no markdown.`,
  );

  return result.response.text().trim();
}
