import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../config/env";

/**
 * One Gemini call per symbol. Deliberately NOT using Google Search grounding
 * — that tool has its own, much stricter quota separate from the regular
 * Gemini API quota, and hit a 429 wall on the free tier almost immediately.
 * This uses the model's general knowledge instead: no live/today's-news
 * awareness, so the caller must present this as an AI perspective, not news
 * — see PositionUpdate.aiTake / the "not live news" labeling in the email.
 */
export async function fetchStockUpdate(symbol: string): Promise<string> {
  if (!env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: env.GEMINI_MODEL });

  const result = await model.generateContent(
    `You're briefing a trader on ${symbol}, an NSE-listed (India) stock they currently hold. ` +
      `Give 2-3 sentences of useful context from what you know about the company: sector, ` +
      `business quality, typical volatility/catalysts, or anything a holder should keep in mind. ` +
      `You have no access to live data — do not claim to know today's price, news, or results. ` +
      `Plain text, no markdown.`,
  );

  return result.response.text().trim();
}
