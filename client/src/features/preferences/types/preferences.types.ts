/* ─────────────────────────────────────────────────────
   DATA CONTRACT — matches trade-edge-api /api/preferences
   GET  /api/preferences  → TradingPreferences
   PUT  /api/preferences  → TradingPreferences
───────────────────────────────────────────────────── */

import type { StrategyId } from "@/features/strategy/strategies";

export type TradingStyle = "swing" | "intraday" | "positional";
export type Timeframe = "Daily" | "Weekly" | "Monthly";

export interface TradingPreferences {
  tradingStyles: TradingStyle[];
  timeframe: Timeframe;
  defaultCapital: number;
  riskPerTrade: number; // % of capital
  maxConcurrentPositions: number;
  atrPeriod: number;
  slAtrMultiplier: number;
  targetAtrMultiplier: number;
  activeStrategy: StrategyId;
}

export const DEFAULT_PREFERENCES: TradingPreferences = {
  tradingStyles: ["swing"],
  timeframe: "Daily",
  defaultCapital: 100000,
  riskPerTrade: 1,
  maxConcurrentPositions: 5,
  atrPeriod: 14,
  slAtrMultiplier: 0.5,
  targetAtrMultiplier: 1,
  activeStrategy: "pulse",
};
