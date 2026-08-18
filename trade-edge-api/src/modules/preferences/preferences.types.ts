import { z } from "zod";

export const TRADING_STYLES = ["swing", "intraday", "positional"] as const;
export const TIMEFRAMES = ["Daily", "Weekly", "Monthly"] as const;
// Active strategy the dashboard renders (Signals / Signal Results branch on this).
// "pulse"/"rsi2" are retired but stay selectable for viewing historical trades.
export const STRATEGIES = ["pulse", "rsi2", "trend-rs55"] as const;

export const SavePreferencesSchema = z.object({
  tradingStyles: z.array(z.enum(TRADING_STYLES)).min(1, "Pick at least one style"),
  timeframe: z.enum(TIMEFRAMES),
  defaultCapital: z.number().positive("Capital must be greater than 0"),
  riskPerTrade: z.number().min(0).max(100),
  maxConcurrentPositions: z.number().int().min(1).max(100),
  atrPeriod: z.number().int().min(1).max(200),
  slAtrMultiplier: z.number().positive(),
  targetAtrMultiplier: z.number().positive(),
  // Optional (default) so older payloads still validate; the client sends it.
  activeStrategy: z.enum(STRATEGIES).default("trend-rs55"),
});

export type SavePreferencesInput = z.infer<typeof SavePreferencesSchema>;
export type PreferencesResponse = SavePreferencesInput;

export const DEFAULT_PREFERENCES: SavePreferencesInput = {
  tradingStyles: ["swing"],
  timeframe: "Daily",
  defaultCapital: 100000,
  riskPerTrade: 1,
  maxConcurrentPositions: 5,
  atrPeriod: 14,
  slAtrMultiplier: 0.5,
  targetAtrMultiplier: 1,
  activeStrategy: "trend-rs55",
};
