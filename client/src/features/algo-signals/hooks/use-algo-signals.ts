import { useQuery } from "@tanstack/react-query";
import {
  fetchDailySignals,
  fetchLatestDailySignal,
  fetchLatestWeeklySignal,
  fetchWeeklySignals,
} from "../api/algo-signals-api";
import type { DailySignalDoc, WeeklySignalDoc } from "../types/algo-signals.types";

export function useLatestDailySignal() {
  return useQuery<DailySignalDoc | null>({
    queryKey: ["algo-signals", "daily", "latest"],
    queryFn: fetchLatestDailySignal,
    staleTime: 1000 * 60,
  });
}

export function useDailySignalHistory(range?: { from?: string; to?: string; limit?: number }) {
  return useQuery<DailySignalDoc[]>({
    queryKey: ["algo-signals", "daily", "history", range?.from, range?.to, range?.limit],
    queryFn: () => fetchDailySignals(range),
    staleTime: 1000 * 60,
  });
}

export function useLatestWeeklySignal() {
  return useQuery<WeeklySignalDoc | null>({
    queryKey: ["algo-signals", "weekly", "latest"],
    queryFn: fetchLatestWeeklySignal,
    staleTime: 1000 * 60,
  });
}

export function useWeeklySignalHistory(range?: { from?: string; to?: string; limit?: number }) {
  return useQuery<WeeklySignalDoc[]>({
    queryKey: ["algo-signals", "weekly", "history", range?.from, range?.to, range?.limit],
    queryFn: () => fetchWeeklySignals(range),
    staleTime: 1000 * 60,
  });
}
