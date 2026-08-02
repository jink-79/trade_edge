import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePulsePerformance, usePulseVariants } from "@/features/pulse/hooks/use-pulse";
import {
  fetchArchiveReport,
  fetchArchiveVersions,
} from "../api/backtest-archive-api";
import { useReportSelection } from "./use-report-selection";
import { STRATEGY, type BacktestMetrics, type Num, type ReportDoc, type ReportUniverse, type VersionRef } from "../types/report.types";

const VARIANT_RE = /^v(\d+)-(tracked|fno)$/;

/** All versions this strategy has, live + archived, newest first. */
export function useVersionList() {
  const { data: variants = [], isLoading: liveLoading } = usePulseVariants();
  const { data: archiveVersions = [], isLoading: archiveLoading } = useQuery({
    queryKey: ["backtest-archive", "versions", STRATEGY],
    queryFn: () => fetchArchiveVersions(STRATEGY),
    staleTime: 1000 * 60,
  });

  const versions = useMemo<VersionRef[]>(() => {
    const live: VersionRef[] = [];
    for (const v of variants) {
      const m = VARIANT_RE.exec(v.variant);
      if (!m) continue; // don't guess at a shape for a variant name we don't recognize
      const [, version, universe] = m;
      live.push({
        strategyName: STRATEGY,
        version,
        universe: universe as ReportUniverse,
        status: null, // live variants have no MD frontmatter — not documented yet
        supersedes: null,
        date: v.asOf?.slice(0, 10) ?? null,
        source: "live",
        label: v.label,
        key: `${version}-${universe}-live`,
      });
    }

    const archive: VersionRef[] = archiveVersions.map((v) => ({
      strategyName: STRATEGY,
      version: v.version,
      universe: v.universe,
      status: v.status,
      supersedes: v.supersedes,
      date: v.date,
      source: "archive",
      label: null,
      key: `${v.version}-${v.universe}-archive`,
    }));

    // Prefer the live copy if the same (version, universe) exists in both.
    const seen = new Set(live.map((v) => `${v.version}-${v.universe}`));
    const merged = [...live, ...archive.filter((v) => !seen.has(`${v.version}-${v.universe}`))];
    return merged.sort((a, b) => Number(b.version) - Number(a.version) || a.universe.localeCompare(b.universe));
  }, [variants, archiveVersions]);

  return { versions, isLoading: liveLoading || archiveLoading };
}

const numOrNull = (v: unknown): Num => (typeof v === "number" && Number.isFinite(v) ? v : null);

/** Backfills a live PulsePerformance.metrics blob (old + new field names,
 * courier-dependent) into the full BacktestMetrics shape. Anything the
 * courier hasn't computed yet stays null — never fabricated. */
function normalizeLiveMetrics(raw: Record<string, unknown> | null | undefined, ref: VersionRef): BacktestMetrics {
  const r = raw ?? {};
  const get = (...keys: string[]): Num => {
    for (const k of keys) {
      const v = numOrNull(r[k]);
      if (v != null) return v;
    }
    return null;
  };
  return {
    strategyName: ref.strategyName,
    version: ref.version,
    universe: ref.universe,
    universeSize: get("universeSize"),
    symbolsWithData: get("symbolsWithData"),
    symbolsTraded: get("symbolsTraded"),
    market: (r.market as string) ?? "NSE",
    timeframe: (r.timeframe as string) ?? "Weekly",
    startDate: (r.startDate as string) ?? null,
    endDate: (r.endDate as string) ?? null,
    yearsTested: get("yearsTested"),
    initialCapital: get("initialCapital"),
    finalCapital: get("finalCapital"),
    commissionPct: get("commissionPct"),
    positionSizingRule: (r.positionSizingRule as string) ?? null,
    entryRules: (r.entryRules as string) ?? null,
    exitRules: (r.exitRules as string) ?? null,
    generatedAt: (r.generatedAt as string) ?? null,

    cagrPct: get("cagrPct"),
    totalReturnPct: get("totalReturnPct", "returnPct"),
    netProfit: get("netProfit"),
    avgAnnualReturnPct: get("avgAnnualReturnPct"),
    avgMonthlyReturnPct: get("avgMonthlyReturnPct"),
    yearlyReturns: Array.isArray(r.yearlyReturns) ? (r.yearlyReturns as BacktestMetrics["yearlyReturns"]) : [],
    niftyCagrPct: get("niftyCagrPct"),
    alphaPct: get("alphaPct"),

    maxDrawdownPct: get("maxDrawdownPct"),
    avgDrawdownPct: get("avgDrawdownPct"),
    maxDrawdownWeeks: get("maxDrawdownWeeks"),
    drawdownEpisodes: Array.isArray(r.drawdownEpisodes) ? (r.drawdownEpisodes as BacktestMetrics["drawdownEpisodes"]) : [],
    recoveryWeeks: get("recoveryWeeks"),
    volatilityPct: get("volatilityPct"),
    ulcerIndex: get("ulcerIndex"),

    sharpe: get("sharpe"),
    sortino: get("sortino"),
    calmar: get("calmar"),

    totalTrades: get("totalTrades", "trades"),
    winningTrades: get("winningTrades"),
    losingTrades: get("losingTrades"),
    winRatePct: get("winRatePct"),
    lossRatePct: get("lossRatePct"),
    noTradeYears: Array.isArray(r.noTradeYears) ? (r.noTradeYears as number[]) : [],

    profitFactor: get("profitFactor"),
    expectancyPct: get("expectancyPct"),
    medianTradePct: get("medianTradePct"),
    avgWinPct: get("avgWinPct"),
    avgLossPct: get("avgLossPct"),
    rewardRiskRatio: get("rewardRiskRatio"),

    bestTradePct: get("bestTradePct"),
    worstTradePct: get("worstTradePct"),
    largestWinRs: get("largestWinRs"),
    largestLossRs: get("largestLossRs"),
    top10WinnersContributionPct: get("top10WinnersContributionPct"),
    top10LosersContributionPct: get("top10LosersContributionPct"),

    maxWinStreak: get("maxWinStreak"),
    maxLossStreak: get("maxLossStreak"),
    avgWinStreak: get("avgWinStreak"),
    avgLossStreak: get("avgLossStreak"),

    avgHoldWeeks: get("avgHoldWeeks"),
    medianHoldWeeks: get("medianHoldWeeks"),
    maxHoldWeeks: get("maxHoldWeeks"),
    minHoldWeeks: get("minHoldWeeks"),
    avgWinningHoldWeeks: get("avgWinningHoldWeeks"),
    avgLosingHoldWeeks: get("avgLosingHoldWeeks"),

    avgPositionSizeRs: get("avgPositionSizeRs"),
    avgPositionCountExposure: get("avgPositionCountExposure"),
    avgCapitalUtilizationPct: get("avgCapitalUtilizationPct"),
    cashIdlePct: get("cashIdlePct"),
    maxConcurrentPositions: get("maxConcurrentPositions"),

    timeInMarketPct: get("timeInMarketPct"),
    tradesPerYear: get("tradesPerYear"),
    tradesPerMonth: get("tradesPerMonth"),

    equityCurveR2: get("equityCurveR2"),

    portfolioVolatilityPct: get("portfolioVolatilityPct"),
    tradeReturnStdDevPct: get("tradeReturnStdDevPct"),
    tradeReturnSkew: get("tradeReturnSkew"),
    tradeReturnKurtosis: get("tradeReturnKurtosis"),
    profitableMonthsPct: get("profitableMonthsPct"),

    bestMonthPct: get("bestMonthPct"),
    worstMonthPct: get("worstMonthPct"),
    bestYearPct: get("bestYearPct"),
    worstYearPct: get("worstYearPct"),
    positiveYearsPct: get("positiveYearsPct"),

    sqn: get("sqn"),
    kellyPct: get("kellyPct"),

    avgTradesPerSymbol: get("avgTradesPerSymbol"),
    sectorBreakdown: Array.isArray(r.sectorBreakdown) ? (r.sectorBreakdown as BacktestMetrics["sectorBreakdown"]) : [],
    marketCapBreakdown: Array.isArray(r.marketCapBreakdown) ? (r.marketCapBreakdown as BacktestMetrics["marketCapBreakdown"]) : [],
  };
}

export interface BacktestReportData {
  versions: VersionRef[];
  current: VersionRef | null;
  metrics: BacktestMetrics | null;
  doc: ReportDoc | null;
  isLoading: boolean;
}

/** The single hook every report page uses: resolves the selected
 * version+universe against the merged live/archive list, then fetches that
 * version's metrics + doc from whichever source it actually lives in. */
export function useBacktestReport(): BacktestReportData {
  const selection = useReportSelection();
  const { versions, isLoading: versionsLoading } = useVersionList();
  const { data: livePerf = [] } = usePulsePerformance();

  const current = useMemo<VersionRef | null>(() => {
    if (!versions.length) return null;
    if (selection.version) {
      return (
        versions.find((v) => v.version === selection.version && v.universe === selection.universe) ??
        versions.find((v) => v.version === selection.version) ??
        versions[0]
      );
    }
    // No explicit ?v= selection: prefer the adopted version (the one we're
    // actually running), then any uploaded archive (it has a full write-up +
    // metrics), then fall back to the newest — so a data-less live variant
    // isn't shown by default over a documented upload.
    return (
      versions.find((v) => v.status === "adopted" && v.universe === selection.universe) ??
      versions.find((v) => v.source === "archive" && v.universe === selection.universe) ??
      versions.find((v) => v.universe === selection.universe) ??
      versions[0]
    );
  }, [versions, selection]);

  const archiveQuery = useQuery({
    queryKey: ["backtest-archive", "report", STRATEGY, current?.version, current?.universe],
    queryFn: () => fetchArchiveReport(STRATEGY, current!.version, current!.universe),
    enabled: current?.source === "archive",
    staleTime: 1000 * 60,
  });

  const { metrics, doc }: { metrics: BacktestMetrics | null; doc: ReportDoc | null } = useMemo(() => {
    if (!current) return { metrics: null, doc: null };
    if (current.source === "live") {
      const perf = livePerf.find((p) => p.variant === `v${current.version}-${current.universe}`);
      const m = normalizeLiveMetrics(perf?.metrics as Record<string, unknown> | undefined, current);
      m.equityCurve = perf?.equityCurve;
      m.monthlyReturns = perf?.monthlyReturns;
      m.benchmarkCurve = perf?.benchmarkCurve;
      return { metrics: m, doc: { status: null, supersedes: null, date: current.date, body: null } };
    }
    const report = archiveQuery.data;
    if (!report) return { metrics: null, doc: null };
    return {
      metrics: report.metrics,
      doc: { status: report.status, supersedes: report.supersedes, date: report.date, body: report.mdBody },
    };
  }, [current, livePerf, archiveQuery.data]);

  return {
    versions,
    current,
    metrics,
    doc,
    isLoading: versionsLoading || (current?.source === "archive" && archiveQuery.isLoading),
  };
}
