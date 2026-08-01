export const fmtPct = (n: number | null | undefined, d = 1) =>
  n == null ? "—" : `${n.toFixed(d)}%`;

export const fmtNum = (n: number | null | undefined, d = 2) =>
  n == null ? "—" : n.toFixed(d);

export const fmtMoney = (n: number | null | undefined) =>
  n == null ? "—" : `₹${Math.round(n).toLocaleString("en-IN")}`;

export const fmtL = (n: number) => `₹${(n / 100000).toFixed(1)}L`;

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

export const fmtRs = (n: number | null | undefined, d = 2) =>
  n == null ? "—" : `₹${n.toFixed(d)}`;
