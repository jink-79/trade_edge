const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** ₹8,24,310 */
export const fmtINR = (n: number): string => inr.format(Math.round(n));

/** ₹8.2L / ₹1.4Cr / ₹24,500 — for tight spots like headings. */
export function fmtINRShort(n: number): string {
  const sign = n < 0 ? "−" : "";
  const a = Math.abs(n);
  if (a >= 1e7) return `${sign}₹${trim(a / 1e7)}Cr`;
  if (a >= 1e5) return `${sign}₹${trim(a / 1e5)}L`;
  return `${sign}${inr.format(Math.round(a))}`;
}
const trim = (x: number) => (x >= 100 ? x.toFixed(0) : x.toFixed(1).replace(/\.0$/, ""));

/** "2026-11" for today. */
export function currentMonth(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** "2026-11" → "Nov 2026" */
export function monthLabel(m: string): string {
  const [y, mo] = m.split("-").map(Number);
  return new Date(y, mo - 1, 1).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

/** 824310.5 → "8,24,310.5" for pre-filling amount inputs; "" for empty. */
export function amountText(n: number | null | undefined): string {
  return n == null ? "" : n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

/** Parses "8,24,310.50" → 824310.5; returns null for empty/invalid. */
export function parseAmount(s: string): number | null {
  const cleaned = s.replace(/[,\s₹]/g, "");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** "2026-11" + (-1) → "2026-10" */
export function addMonths(m: string, delta: number): string {
  const [y, mo] = m.split("-").map(Number);
  return currentMonth(new Date(y, mo - 1 + delta, 1));
}

/** "2026-11" → "Nov" */
export function shortMonth(m: string): string {
  const [y, mo] = m.split("-").map(Number);
  return new Date(y, mo - 1, 1).toLocaleDateString("en-IN", { month: "short" });
}

/** "2026-11" → "November" */
export function longMonth(m: string): string {
  const [y, mo] = m.split("-").map(Number);
  return new Date(y, mo - 1, 1).toLocaleDateString("en-IN", { month: "long" });
}
