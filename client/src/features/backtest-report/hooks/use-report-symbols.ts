import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSymbolScorecard } from "@/features/pulse/hooks/use-pulse";
import type { ScorecardUniverse } from "@/features/pulse/types/pulse.types";
import { fetchArchiveSymbolScorecard } from "../api/backtest-archive-api";
import { STRATEGY, type SymbolScorecardRow, type VersionRef } from "../types/report.types";

export interface ReportSymbolsQuery {
  page?: number;
  pageSize?: number;
  q?: string;
  verdict?: string;
}

/** Symbol scorecard rows for the current version, from whichever source it
 * lives in. Live snapshots aren't paginated server-side (bounded row count,
 * same as the Symbol Scorecard page) so filtering/paging happens here;
 * archive rows are already paginated by the API. */
export function useReportSymbols(current: VersionRef | null, query: ReportSymbolsQuery = {}) {
  const { page = 1, pageSize = 100, q = "", verdict } = query;

  const live = useSymbolScorecard((current?.universe ?? "tracked") as ScorecardUniverse);
  const archive = useQuery({
    queryKey: ["backtest-archive", "symbol-scorecard", STRATEGY, current?.version, current?.universe, page, pageSize, q, verdict],
    queryFn: () =>
      fetchArchiveSymbolScorecard(STRATEGY, current!.version, current!.universe, { page, pageSize, q, verdict }),
    enabled: current?.source === "archive",
    staleTime: 1000 * 60,
  });

  return useMemo(() => {
    if (!current) return { rows: [] as SymbolScorecardRow[], total: 0, isLoading: false };

    if (current.source === "archive") {
      const data = archive.data;
      return { rows: data?.rows ?? [], total: data?.total ?? 0, isLoading: archive.isLoading };
    }

    let rows = (live.data?.symbols ?? []) as unknown as SymbolScorecardRow[];
    if (q) rows = rows.filter((r) => r.Symbol.toLowerCase().includes(q.toLowerCase()));
    if (verdict) rows = rows.filter((r) => r.Verdict === verdict);
    rows = [...rows].sort((a, b) => (b["Net P&L (Rs)"] ?? -Infinity) - (a["Net P&L (Rs)"] ?? -Infinity));
    const total = rows.length;
    const start = (page - 1) * pageSize;
    return { rows: rows.slice(start, start + pageSize), total, isLoading: live.isLoading };
  }, [current, live.data, live.isLoading, archive.data, archive.isLoading, page, pageSize, q, verdict]);
}
