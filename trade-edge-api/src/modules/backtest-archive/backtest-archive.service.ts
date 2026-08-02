import {
  BacktestArchiveReport,
  BacktestArchiveSymbolStats,
  BacktestArchiveTradeLogRow,
} from "./backtest-archive.model";
import type { ParsedArchive, ParsedMd } from "./backtest-archive.parser";
import type { UploadMeta, SymbolScorecardQuery, TradeLogQuery } from "./backtest-archive.types";
import type { GroupBreakdownRow } from "../reports/report.types";

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export interface UploadSourceFiles {
  xlsx: string | null;
  csv: string | null;
  md: string | null;
}

/** Store (replacing any prior upload for the same identity) all three archive pieces. */
export async function upsertArchive(
  userId: string,
  meta: UploadMeta,
  parsed: ParsedArchive,
  md: ParsedMd | null,
  sourceFiles: UploadSourceFiles,
) {
  const { strategyName, version, universe } = meta;
  const key = { userId, strategyName, version, universe };

  const report = await BacktestArchiveReport.findOneAndUpdate(
    key,
    {
      $set: {
        ...key,
        status: md?.status ?? null,
        supersedes: md?.supersedes ?? null,
        date: md?.date ?? null,
        mdBody: md?.body ?? null,
        metrics: parsed.metrics,
        sourceFiles,
        uploadedAt: new Date(),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();

  await BacktestArchiveSymbolStats.findOneAndUpdate(
    key,
    { $set: { ...key, symbols: parsed.symbols } },
    { upsert: true, setDefaultsOnInsert: true },
  );

  await BacktestArchiveTradeLogRow.deleteMany(key);
  if (parsed.tradeLog.length) {
    const docs = parsed.tradeLog.map((row) => ({
      ...key,
      symbol: row.Symbol,
      exitDate: row["Exit Date"] ? new Date(row["Exit Date"]) : null,
      row,
    }));
    await BacktestArchiveTradeLogRow.insertMany(docs, { ordered: false });
  }

  return {
    report,
    symbolCount: parsed.symbols.length,
    tradeLogCount: parsed.tradeLog.length,
  };
}

/** Delete one archived version (report + scorecard + trade-log rows). */
export async function deleteArchive(
  userId: string,
  strategyName: string,
  version: string,
  universe: string,
) {
  const key = { userId, strategyName, version, universe };
  const [report, symbols, trades] = await Promise.all([
    BacktestArchiveReport.deleteOne(key),
    BacktestArchiveSymbolStats.deleteOne(key),
    BacktestArchiveTradeLogRow.deleteMany(key),
  ]);
  return {
    deletedReport: report.deletedCount,
    deletedSymbols: symbols.deletedCount,
    deletedTrades: trades.deletedCount,
  };
}

/** Distinct strategy names on file, with a version count — for the strategy picker. */
export async function listStrategies(userId: string) {
  return BacktestArchiveReport.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: "$strategyName",
        versions: { $sum: 1 },
        latestUpload: { $max: "$uploadedAt" },
      },
    },
    { $project: { _id: 0, strategyName: "$_id", versions: 1, latestUpload: 1 } },
    { $sort: { strategyName: 1 } },
  ]);
}

/** Version + universe list for one strategy — for the version picker. */
export async function listVersions(userId: string, strategyName: string) {
  return BacktestArchiveReport.find({ userId, strategyName })
    .select("version universe status supersedes date uploadedAt -_id")
    .sort({ version: -1, universe: 1 })
    .lean();
}

/** The full report (metrics + MD frontmatter/body) for one strategy+version+universe. */
export async function getReport(
  userId: string,
  strategyName: string,
  version: string,
  universe: string,
) {
  return BacktestArchiveReport.findOne({ userId, strategyName, version, universe }).lean();
}

/** Sector or market-cap breakdown — small tables, embedded in the report's metrics. */
export async function getGroupBreakdown(
  userId: string,
  strategyName: string,
  version: string,
  universe: string,
  group: "sector" | "marketCap",
): Promise<GroupBreakdownRow[] | null> {
  const report = await BacktestArchiveReport.findOne({
    userId,
    strategyName,
    version,
    universe,
  })
    .select("metrics.sectorBreakdown metrics.marketCapBreakdown")
    .lean();
  if (!report) return null;
  return group === "sector"
    ? (report.metrics?.sectorBreakdown ?? [])
    : (report.metrics?.marketCapBreakdown ?? []);
}

/** Symbol scorecard, filtered/sorted/paginated in-memory (bounded row count, no need for a paginated collection). */
export async function getSymbolScorecardPage(
  userId: string,
  strategyName: string,
  version: string,
  universe: string,
  { page, pageSize, q, verdict }: SymbolScorecardQuery,
) {
  const doc = await BacktestArchiveSymbolStats.findOne({
    userId,
    strategyName,
    version,
    universe,
  }).lean();
  if (!doc) return null;

  let rows: any[] = doc.symbols ?? [];
  if (q) {
    const needle = q.toLowerCase();
    rows = rows.filter((r) => String(r.Symbol ?? "").toLowerCase().includes(needle));
  }
  if (verdict) {
    rows = rows.filter((r) => r.Verdict === verdict);
  }
  rows = [...rows].sort(
    (a, b) => (b["Net P&L (Rs)"] ?? -Infinity) - (a["Net P&L (Rs)"] ?? -Infinity),
  );

  const total = rows.length;
  const start = (page - 1) * pageSize;
  return { total, page, pageSize, rows: rows.slice(start, start + pageSize) };
}

/** Trade log, paginated at the DB level (one document per trade — can run into the thousands). */
export async function getTradeLogPage(
  userId: string,
  strategyName: string,
  version: string,
  universe: string,
  { page, pageSize, symbol }: TradeLogQuery,
) {
  const query: Record<string, unknown> = { userId, strategyName, version, universe };
  if (symbol) query.symbol = new RegExp(escapeRegex(symbol), "i");

  const [total, docs] = await Promise.all([
    BacktestArchiveTradeLogRow.countDocuments(query),
    BacktestArchiveTradeLogRow.find(query)
      .sort({ exitDate: 1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .select("row -_id")
      .lean(),
  ]);

  return { total, page, pageSize, rows: docs.map((d) => d.row) };
}
