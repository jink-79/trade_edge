import { useQuery } from "@tanstack/react-query";
import { fetchDailyPnlHistory, fetchLatestDailyPnl } from "../api/daily-pnl-api";
import type { DailyPnlSnapshot } from "../types/daily-pnl.types";

export function useLatestDailyPnl() {
  return useQuery<DailyPnlSnapshot | null>({
    queryKey: ["daily-pnl", "latest"],
    queryFn: fetchLatestDailyPnl,
    staleTime: 1000 * 60,
  });
}

export function useDailyPnlHistory(range?: { from?: string; to?: string; limit?: number }) {
  return useQuery<DailyPnlSnapshot[]>({
    queryKey: ["daily-pnl", "history", range?.from, range?.to, range?.limit],
    queryFn: () => fetchDailyPnlHistory(range),
    staleTime: 1000 * 60,
  });
}
