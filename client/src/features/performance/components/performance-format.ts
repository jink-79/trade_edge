/** A fraction (0.12) → "+12.00%". */
export const fmtPct = (n: number | null | undefined, signed = false) =>
  n == null
    ? "—"
    : `${signed && n >= 0 ? "+" : ""}${(n * 100).toFixed(2)}%`;

/** An already-percent value (0–100) → "58.3%". */
export const fmtPctRaw = (n: number | null | undefined) =>
  n == null ? "—" : `${n.toFixed(1)}%`;

export const fmtNum = (n: number | null | undefined, dp = 2) =>
  n == null || !Number.isFinite(n) ? "—" : n.toFixed(dp);

export const fmtR = (n: number | null | undefined) =>
  n == null ? "—" : `${n >= 0 ? "+" : ""}${n.toFixed(2)}R`;

export const fmtDays = (n: number | null | undefined) =>
  n == null ? "—" : `${Math.round(n)}d`;

export const fmtInt = (n: number | null | undefined) =>
  n == null ? "—" : String(Math.round(n));
