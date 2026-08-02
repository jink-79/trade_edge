import { useQuery } from "@tanstack/react-query";
import { fetchArchiveTradeLog } from "../api/backtest-archive-api";
import { STRATEGY, type TradeLogRow, type VersionRef } from "../types/report.types";

export interface ReportTradeLogQuery {
  page?: number;
  pageSize?: number;
}

/** Trade log for one symbol of the current version. Archive versions have a
 * dedicated, server-paginated trade-log collection; live variants don't carry a
 * flat trade log (their trades live inside the weekly blotter), so `available`
 * is false there and the detail page shows a note instead of an empty table. */
export function useReportTradeLog(
  current: VersionRef | null,
  symbol: string,
  { page = 1, pageSize = 100 }: ReportTradeLogQuery = {},
) {
  // symbol "" means "all trades" (used for the distribution charts).
  const enabled = current?.source === "archive";
  const archive = useQuery({
    queryKey: ["backtest-archive", "trade-log", STRATEGY, current?.version, current?.universe, symbol, page, pageSize],
    queryFn: () =>
      fetchArchiveTradeLog(STRATEGY, current!.version, current!.universe, { symbol, page, pageSize }),
    enabled,
    staleTime: 1000 * 60,
  });

  if (current?.source === "archive") {
    return {
      rows: (archive.data?.rows ?? []) as TradeLogRow[],
      total: archive.data?.total ?? 0,
      isLoading: archive.isLoading,
      available: true,
    };
  }
  return { rows: [] as TradeLogRow[], total: 0, isLoading: false, available: false };
}
