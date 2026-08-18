export const fmtNum = (n: number | null | undefined, d = 2) =>
  n == null ? "—" : n.toFixed(d);

export const fmtMoney = (n: number | null | undefined) =>
  n == null ? "—" : `₹${Math.round(n).toLocaleString("en-IN")}`;

export const fmtPct = (n: number | null | undefined, d = 1) =>
  n == null ? "—" : `${n.toFixed(d)}%`;

export const fmtDate = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

export const fmtDateTime = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
