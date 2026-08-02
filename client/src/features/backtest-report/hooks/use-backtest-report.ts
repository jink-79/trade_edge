import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchArchiveReport, fetchArchiveVersions } from "../api/backtest-archive-api";
import { useReportSelection } from "./use-report-selection";
import { STRATEGY, type BacktestMetrics, type ReportDoc, type VersionRef } from "../types/report.types";

/** Every uploaded (archived) version of this strategy, newest first.
 * The report shows ONLY uploaded data — live courier variants are never listed
 * here, so nothing you didn't upload (e.g. an old v10 snapshot) can appear. */
export function useVersionList() {
  const { data: archiveVersions = [], isLoading } = useQuery({
    queryKey: ["backtest-archive", "versions", STRATEGY],
    queryFn: () => fetchArchiveVersions(STRATEGY),
    staleTime: 1000 * 60,
  });

  const versions = useMemo<VersionRef[]>(
    () =>
      archiveVersions
        .map((v) => ({
          strategyName: STRATEGY,
          version: v.version,
          universe: v.universe,
          status: v.status,
          supersedes: v.supersedes,
          date: v.date,
          source: "archive" as const,
          label: null,
          key: `${v.version}-${v.universe}-archive`,
        }))
        .sort((a, b) => Number(b.version) - Number(a.version) || a.universe.localeCompare(b.universe)),
    [archiveVersions],
  );

  return { versions, isLoading };
}

export interface BacktestReportData {
  versions: VersionRef[];
  current: VersionRef | null;
  metrics: BacktestMetrics | null;
  doc: ReportDoc | null;
  isLoading: boolean;
}

/** Resolves the selected (or default) uploaded version and fetches its report. */
export function useBacktestReport(): BacktestReportData {
  const selection = useReportSelection();
  const { versions, isLoading: versionsLoading } = useVersionList();

  const current = useMemo<VersionRef | null>(() => {
    if (!versions.length) return null;
    if (selection.version) {
      return (
        versions.find((v) => v.version === selection.version && v.universe === selection.universe) ??
        versions.find((v) => v.version === selection.version) ??
        versions[0]
      );
    }
    // Default: the adopted upload for the selected universe, else newest.
    return (
      versions.find((v) => v.status === "adopted" && v.universe === selection.universe) ??
      versions.find((v) => v.universe === selection.universe) ??
      versions[0]
    );
  }, [versions, selection]);

  const archiveQuery = useQuery({
    queryKey: ["backtest-archive", "report", STRATEGY, current?.version, current?.universe],
    queryFn: () => fetchArchiveReport(STRATEGY, current!.version, current!.universe),
    enabled: !!current,
    staleTime: 1000 * 60,
  });

  const { metrics, doc } = useMemo<{ metrics: BacktestMetrics | null; doc: ReportDoc | null }>(() => {
    const report = archiveQuery.data;
    if (!report) return { metrics: null, doc: null };
    return {
      metrics: report.metrics,
      doc: { status: report.status, supersedes: report.supersedes, date: report.date, body: report.mdBody },
    };
  }, [archiveQuery.data]);

  return {
    versions,
    current,
    metrics,
    doc,
    isLoading: versionsLoading || (!!current && archiveQuery.isLoading),
  };
}
