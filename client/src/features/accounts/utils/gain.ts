import type { Snapshot } from "../types/accounts.types";

/** Gain/loss from the invested amount, when one was entered. */
export function gainOf(s: Snapshot | null): { amount: number; pct: number } | null {
  if (!s || s.invested == null || s.invested <= 0) return null;
  const amount = s.value - s.invested;
  return { amount, pct: (amount / s.invested) * 100 };
}

export const fmtPct = (p: number) => `${p >= 0 ? "+" : "−"}${Math.abs(p).toFixed(1)}%`;
