import * as XLSX from "xlsx";
import matter from "gray-matter";
import { AppError } from "../../utils/api-error";
import {
  BacktestMetricsSchema,
  SymbolScorecardRowSchema,
  TradeLogRowSchema,
  type BacktestMetrics,
  type SymbolScorecardRow,
  type TradeLogRow,
} from "../reports/report.types";

/**
 * Parses the two artifacts BACKTEST_REPORT_SCHEMA.md requires (XLSX/CSV + MD)
 * into the shared report shape. "Never fabricate a missing field" — every
 * value comes straight from a cell or is `null`; nothing is computed here.
 *
 * XLSX sheet contract (case-insensitive, exact match otherwise) — one sheet
 * per schema-doc section that isn't a flat scalar:
 *   "Metrics"              — two columns, Field | Value — §1-15 + §16 scalar
 *   "Yearly Returns"        — Year | Return %                          (§2)
 *   "Drawdown Episodes"     — Peak Date | Trough Date | Recovery Date |
 *                             Depth % | Duration (weeks)               (§3)
 *   "No Trade Years"        — Year                                     (§5)
 *   "Symbol Scorecard"      — the 19-column table                      (§17)
 *   "Sector Breakdown"      — Group | Trades | ...                     (§18)
 *   "Market Cap Breakdown"  — Group | Trades | ...                     (§18)
 *   "Trade Log"             — the 14-column table (or the sibling CSV) (§19)
 * "Field" values in the Metrics sheet must match this module's camelCase
 * names exactly (e.g. `cagrPct`, `avgCapitalUtilizationPct`) — see
 * src/modules/reports/report.types.ts for the full list.
 */

function findSheet(wb: XLSX.WorkBook, name: string): XLSX.WorkSheet | null {
  const key = Object.keys(wb.Sheets).find(
    (k) => k.trim().toLowerCase() === name.toLowerCase(),
  );
  return key ? wb.Sheets[key] : null;
}

// Blank Excel cells arrive as "" via `defval` — normalize to null so numeric
// coercion (Number("") === 0) never fabricates a zero for a missing value.
// Date-formatted cells arrive as JS Date objects (cellDates: true below) —
// normalize those to a plain YYYY-MM-DD string so date-typed columns like
// Trade Log's Entry/Exit Date (schema type: string, not Date) validate;
// z.coerce.date() fields (§2/§3's date columns) accept the string just fine too.
function cleanRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (v === "") out[k] = null;
    else if (v instanceof Date) out[k] = v.toISOString().slice(0, 10);
    else out[k] = v;
  }
  return out;
}

function sheetRows(ws: XLSX.WorkSheet | null): Record<string, unknown>[] {
  if (!ws) return [];
  return XLSX.utils
    .sheet_to_json<Record<string, unknown>>(ws, { defval: null, raw: true })
    .map(cleanRow);
}

function metricsMap(ws: XLSX.WorkSheet | null): Record<string, unknown> {
  const map: Record<string, unknown> = {};
  for (const r of sheetRows(ws)) {
    const field = r.Field;
    if (field == null || field === "") continue;
    map[String(field).trim()] = r.Value ?? null;
  }
  return map;
}

function issuesToMessage(issues: { path: PropertyKey[]; message: string }[]): string {
  return issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
}

export interface ParsedArchive {
  metrics: BacktestMetrics;
  symbols: SymbolScorecardRow[];
  tradeLog: TradeLogRow[];
}

/** Parse the XLSX workbook (Metrics + all table sheets except Trade Log, which
 * a sibling CSV upload takes precedence over — see `parseTradeLogCsv`). */
export function parseWorkbookBuffer(
  buf: Buffer,
  identity: { strategyName: string; version: string; universe: string },
): ParsedArchive {
  let wb: XLSX.WorkBook;
  try {
    wb = XLSX.read(buf, { type: "buffer", cellDates: true });
  } catch (err) {
    throw AppError.badRequest(`Could not read the XLSX file: ${(err as Error).message}`);
  }

  // Time-series sheets for the charts (equity vs benchmark + weekly concurrency,
  // monthly returns). Optional — older uploads without them just render empty.
  const equityRows = sheetRows(findSheet(wb, "Equity Curve"));
  const monthlyRows = sheetRows(findSheet(wb, "Monthly Returns"));

  const combined = {
    ...metricsMap(findSheet(wb, "Metrics")),
    strategyName: identity.strategyName,
    version: identity.version,
    universe: identity.universe,
    equityCurve: equityRows.map((r) => ({ date: r.date, equity: r.equity })),
    benchmarkCurve: equityRows.map((r) => ({ date: r.date, value: r.nifty })),
    concurrency: equityRows.map((r) => ({ date: r.date, open: r.open })),
    monthlyReturns: monthlyRows.map((r) => ({ month: r.month, ret: r.ret })),
    yearlyReturns: sheetRows(findSheet(wb, "Yearly Returns")),
    drawdownEpisodes: sheetRows(findSheet(wb, "Drawdown Episodes")),
    noTradeYears: sheetRows(findSheet(wb, "No Trade Years"))
      .map((r) => r.Year)
      .filter((y) => y != null),
    sectorBreakdown: sheetRows(findSheet(wb, "Sector Breakdown")),
    marketCapBreakdown: sheetRows(findSheet(wb, "Market Cap Breakdown")),
  };

  const metricsResult = BacktestMetricsSchema.safeParse(combined);
  if (!metricsResult.success) {
    throw AppError.badRequest(
      `Metrics sheet failed validation: ${issuesToMessage(metricsResult.error.issues)}`,
    );
  }

  const symbols = sheetRows(findSheet(wb, "Symbol Scorecard")).map((r, i) => {
    const res = SymbolScorecardRowSchema.safeParse(r);
    if (!res.success) {
      throw AppError.badRequest(
        `Symbol Scorecard row ${i + 1} failed validation: ${issuesToMessage(res.error.issues)}`,
      );
    }
    return res.data;
  });

  const tradeLog = sheetRows(findSheet(wb, "Trade Log")).map((r, i) => {
    const res = TradeLogRowSchema.safeParse(r);
    if (!res.success) {
      throw AppError.badRequest(
        `Trade Log sheet row ${i + 1} failed validation: ${issuesToMessage(res.error.issues)}`,
      );
    }
    return res.data;
  });

  return { metrics: metricsResult.data, symbols, tradeLog };
}

/** The sibling CSV trade log ("for easy re-parsing") — preferred over the XLSX sheet when present. */
export function parseTradeLogCsv(buf: Buffer): TradeLogRow[] {
  let wb: XLSX.WorkBook;
  try {
    wb = XLSX.read(buf.toString("utf-8"), { type: "string", cellDates: true, raw: true });
  } catch (err) {
    throw AppError.badRequest(`Could not read the trade log CSV: ${(err as Error).message}`);
  }
  const rows = sheetRows(wb.Sheets[wb.SheetNames[0]]);
  return rows.map((r, i) => {
    const res = TradeLogRowSchema.safeParse(r);
    if (!res.success) {
      throw AppError.badRequest(
        `Trade log CSV row ${i + 1} failed validation: ${issuesToMessage(res.error.issues)}`,
      );
    }
    return res.data;
  });
}

export interface ParsedMd {
  status: "adopted" | "rejected" | "superseded" | "diagnostic" | null;
  supersedes: string | null;
  date: string | null;
  strategyName: string | null;
  version: string | null;
  universe: string | null;
  body: string;
}

const MD_STATUSES = new Set(["adopted", "rejected", "superseded", "diagnostic"]);

/** Frontmatter -> structured fields; body kept as raw markdown, never re-parsed. */
export function parseMarkdown(buf: Buffer): ParsedMd {
  const { data, content } = matter(buf.toString("utf-8"));
  const status = typeof data.status === "string" ? data.status : null;
  return {
    status: (status && MD_STATUSES.has(status) ? status : null) as ParsedMd["status"],
    supersedes: data.supersedes != null ? String(data.supersedes) : null,
    date: data.date != null ? String(data.date) : null,
    strategyName: data.strategy_name != null ? String(data.strategy_name) : null,
    version: data.version != null ? String(data.version) : null,
    universe: data.universe != null ? String(data.universe) : null,
    body: content.trim(),
  };
}
