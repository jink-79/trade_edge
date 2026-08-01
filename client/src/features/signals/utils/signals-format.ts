import type {
  BacktestMetrics,
  Performance,
} from "@/features/performance/types/performance.types";
import type { ScannerSignal, UploadRow } from "@/features/scanner/types/scanner.types";

/** Split one CSV line honoring "quoted, fields". */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } else inQ = false;
      } else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function toISO(d: string): string | null {
  const dm = d.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (dm) return `${dm[3]}-${dm[2]}-${dm[1]}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  return null;
}

/** Parse a Chartink backtest CSV (Date, Symbol, Marketcap, Sector) → rows. */
export function parseChartinkCsv(text: string): { rows: UploadRow[]; errors: number } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { rows: [], errors: 0 };
  const header = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
  const col = (...names: string[]) =>
    header.findIndex((h) => names.some((n) => h.includes(n)));
  const di = col("date");
  const si = col("symbol", "nsecode", "stock");
  const sci = col("sector");
  const mi = col("marketcap", "cap");
  if (di < 0 || si < 0) return { rows: [], errors: lines.length - 1 };
  const rows: UploadRow[] = [];
  let errors = 0;
  for (let i = 1; i < lines.length; i++) {
    const f = splitCsvLine(lines[i]);
    const iso = toISO((f[di] ?? "").trim());
    const symbol = (f[si] ?? "").trim().toUpperCase();
    if (!iso || !symbol) { errors++; continue; }
    rows.push({
      scanDate: iso,
      symbol,
      sector: sci >= 0 ? f[sci]?.trim() || undefined : undefined,
      marketCap: mi >= 0 ? f[mi]?.trim() || undefined : undefined,
    });
  }
  return { rows, errors };
}

export const inr = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

/** n is already a percent (e.g. 3.2 → "+3.20%"). */
export const pct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;

const fpct = (frac: number | null | undefined, signed = true) =>
  frac == null ? "—" : `${signed && frac >= 0 ? "+" : ""}${(frac * 100).toFixed(2)}%`;
const fnum = (n: number | null | undefined, dp = 2) =>
  n == null || !Number.isFinite(n) ? "—" : n.toFixed(dp);
const fR = (n: number | null | undefined) =>
  n == null ? "—" : `${n >= 0 ? "+" : ""}${n.toFixed(2)}R`;
const fdays = (n: number | null | undefined) =>
  n == null ? "—" : `${Math.round(n)} days`;
const fint = (n: number | null | undefined) =>
  n == null ? "—" : String(Math.round(n));

export type Tone = "default" | "pos" | "neg";
export interface Stat {
  l: string;
  v: string;
  t?: Tone;
  hint?: string;
}

const sign = (n: number | null | undefined): Tone =>
  n == null ? "default" : n >= 0 ? "pos" : "neg";

/** Strategy vs Nifty equity, indexed for the chart. */
export function equitySeries(perf: Performance) {
  const byDate = new Map<string, { t: string; strategy?: number; nifty?: number }>();
  for (const p of perf.equityCurve)
    if (p.equity != null)
      byDate.set(p.date, { t: p.date.slice(5), strategy: p.equity });
  for (const b of perf.benchmarkCurve) {
    if (b.value == null) continue;
    const row = byDate.get(b.date) ?? { t: b.date.slice(5) };
    row.nifty = b.value;
    byDate.set(b.date, row);
  }
  return Array.from(byDate.values()).sort((a, b) => (a.t < b.t ? -1 : 1));
}

export function monthlyReturns(perf: Performance) {
  return perf.monthlyReturns
    .filter((m) => m.ret != null)
    .map((m) => ({ m: m.month.slice(2), r: (m.ret as number) * 100 }));
}

export function statSections(m: BacktestMetrics) {
  return {
    returns: [
      { l: "Total Return", v: fpct(m.totalReturn), t: sign(m.totalReturn) },
      { l: "Buy & Hold (eq-wt)", v: fpct(m.buyHoldEqualWeight), t: sign(m.buyHoldEqualWeight) },
      { l: "CAGR", v: fpct(m.cagr), t: sign(m.cagr) },
      { l: "Nifty 50 CAGR", v: fpct(m.niftyCagr) },
      { l: "Alpha vs Nifty", v: fpct(m.alphaVsNifty), t: sign(m.alphaVsNifty) },
    ] as Stat[],
    risk: [
      { l: "Max Drawdown", v: fpct(m.maxDrawdown), t: "neg" },
      { l: "Avg Drawdown", v: fpct(m.avgDrawdown), t: "neg" },
      { l: "Max DD Duration", v: fdays(m.maxDrawdownDurationDays) },
      { l: "Volatility (Ann.)", v: fpct(m.volatilityAnnualized, false) },
    ] as Stat[],
    perf: [
      { l: "Sharpe Ratio", v: fnum(m.sharpe), t: (m.sharpe ?? 0) >= 1 ? "pos" : "default" },
      { l: "Sortino Ratio", v: fnum(m.sortino), t: (m.sortino ?? 0) >= 1 ? "pos" : "default" },
      { l: "Calmar Ratio", v: fnum(m.calmar), t: (m.calmar ?? 0) >= 1 ? "pos" : "default" },
      { l: "Profit Factor", v: fnum(m.profitFactor), t: (m.profitFactor ?? 0) >= 1 ? "pos" : "neg" },
    ] as Stat[],
    trades: [
      { l: "Total Trades", v: fint(m.totalTrades) },
      { l: "Win Rate", v: m.winRate != null ? `${m.winRate.toFixed(1)}%` : "—", t: (m.winRate ?? 0) >= 50 ? "pos" : "default" },
      { l: "Best Trade", v: fR(m.bestTradeR), t: "pos" },
      { l: "Worst Trade", v: fR(m.worstTradeR), t: "neg" },
      { l: "Avg Trade Duration", v: fdays(m.avgTradeDurationDays) },
      { l: "Avg Win", v: fR(m.avgWinR), t: "pos" },
      { l: "Avg Loss", v: fR(m.avgLossR), t: "neg" },
      { l: "Expectancy", v: fR(m.expectancyR), t: sign(m.expectancyR) },
      { l: "Longest Losing Streak", v: fint(m.longestLosingStreak) },
      { l: "Max Consecutive Wins", v: fint(m.maxConsecutiveWins) },
    ] as Stat[],
    robust: [
      { l: "OOS / IS Return Ratio", v: fnum(m.oosIsRatio), hint: "Healthy above 0.70" },
      { l: "~Trades / yr", v: fint(m.tradesPerYear) },
      { l: "R : R", v: m.rr != null ? `${m.rr.toFixed(2)} : 1` : "—", t: "pos" },
      { l: "Losing %", v: m.lossRate != null ? `${m.lossRate.toFixed(1)}%` : "—", t: "neg" },
    ] as Stat[],
  };
}

export interface DayRow {
  symbol: string;
  name: string;
  sector: string;
  qty: number;
  entry: number;
  exit: number;
  days: number;
  status: string;
}

const STATUS_LABEL: Record<string, string> = {
  TARGET: "Target",
  STOP: "Stop",
  TIMEOUT: "Time exit",
  OPEN: "Open",
};

/** Map scanner signals for a day to display rows (paper qty from fixed-risk). */
export function toDayRows(
  signals: ScannerSignal[],
  capital: number,
  riskFrac: number,
): DayRow[] {
  return signals
    .filter((s) => s.entry)
    .map((s) => {
      const entry = s.entry!.entryPrice;
      const stop = s.entry!.stopPrice;
      const risk = entry - stop;
      const qty = risk > 0 ? Math.max(1, Math.round((capital * riskFrac) / risk)) : 0;
      const exit = s.result?.exitPrice ?? s.tracking?.lastPrice ?? entry;
      const days = s.result?.daysToResolve ?? s.tracking?.daysHeld ?? 0;
      return {
        symbol: s.symbol,
        name: s.symbol,
        sector: s.sector || "—",
        qty,
        entry,
        exit,
        days,
        status: STATUS_LABEL[s.status] ?? s.status,
      };
    })
    .sort((a, b) => a.symbol.localeCompare(b.symbol));
}
