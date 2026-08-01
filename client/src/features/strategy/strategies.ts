// The trading strategies the dashboard can render. The active one lives in the
// user's Preferences (server-saved) and drives the Signals / Signal Results pages.
// Add new strategies here as research matures.

export const STRATEGIES = [
  { id: "pulse", label: "Pulse Breaker", sub: "Weekly · v10" },
  { id: "rsi2", label: "RSI_2", sub: "Daily · Chartink" },
] as const;

export type StrategyId = (typeof STRATEGIES)[number]["id"];

export const DEFAULT_STRATEGY: StrategyId = "pulse";

export function strategyMeta(id: string | undefined | null) {
  return STRATEGIES.find((s) => s.id === id) ?? STRATEGIES[0];
}
