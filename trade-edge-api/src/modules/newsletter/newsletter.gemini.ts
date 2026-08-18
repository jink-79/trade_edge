import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../config/env";

/**
 * One Gemini call per symbol, with Google Search grounding enabled, so the
 * summary reflects what actually happened today — not the model's training
 * data. Deliberately NOT forced into a JSON response schema: grounding tools
 * and strict structured output don't reliably combine in the Gemini API, so
 * this returns plain text and the caller renders it as-is.
 */
export async function fetchStockUpdate(symbol: string): Promise<string> {
  if (!env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: env.GEMINI_MODEL,
    tools: [{ googleSearchRetrieval: {} }],
  });

  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const result = await model.generateContent(
    `Today is ${today}. Search for and summarize what happened today with ` +
      `${symbol} on the NSE (National Stock Exchange of India) — price action, ` +
      `any news, quarterly results, or announcements from the last 1-2 days. ` +
      `3-4 sentences, plain text, mention specific dates/figures if you find them. ` +
      `If you find nothing notable, say so plainly instead of inventing anything.`,
  );

  return result.response.text().trim();
}
