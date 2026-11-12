import { currentMonth } from "@/lib/format";
import type { Possession } from "../types/possessions.types";

/** Whole months from `from` to `to` ("YYYY-MM"), never negative. */
export function monthsBetween(from: string, to: string): number {
  const [fy, fm] = from.split("-").map(Number);
  const [ty, tm] = to.split("-").map(Number);
  return Math.max(0, (ty - fy) * 12 + (tm - fm));
}

/**
 * What an item is worth now: it loses `yearlyDropPct` of its value every
 * year (compounded, spread across months), the way cars and phones do.
 */
export function valueNow(
  p: Pick<Possession, "purchasePrice" | "purchaseMonth" | "yearlyDropPct">,
  month = currentMonth(),
): number {
  const years = monthsBetween(p.purchaseMonth, month) / 12;
  return p.purchasePrice * Math.pow(1 - p.yearlyDropPct / 100, years);
}

/** Age as "2 yrs 3 mo", "8 mo", or "New". */
export function ageLabel(purchaseMonth: string, month = currentMonth()): string {
  const total = monthsBetween(purchaseMonth, month);
  if (total === 0) return "New";
  const y = Math.floor(total / 12);
  const m = total % 12;
  return [y ? `${y} yr${y > 1 ? "s" : ""}` : "", m ? `${m} mo` : ""].filter(Boolean).join(" ");
}

export function totals(items: Possession[]) {
  const paid = items.reduce((s, p) => s + p.purchasePrice, 0);
  const worth = items.reduce((s, p) => s + valueNow(p), 0);
  return { paid, worth };
}
