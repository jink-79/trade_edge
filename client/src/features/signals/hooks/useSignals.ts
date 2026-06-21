import { useQuery } from "@tanstack/react-query";
import { fetchAvailableWeeks, fetchSignalsByWeek } from "../api/signals-api";
import type {
  SignalsWeekResponse,
  WeeksListResponse,
} from "../types/signals.types";

export const signalKeys = {
  all: ["signals"] as const,
  byWeek: (week: string) => ["signals", "week", week] as const,
  weeks: () => ["signals", "weeks"] as const,
};

/**
 * Fetch signals for the selected week.
 * Disabled until a weekStart is provided.
 */
export function useSignalsByWeek(weekStart: string | null) {
  return useQuery<SignalsWeekResponse>({
    queryKey: signalKeys.byWeek(weekStart ?? ""),
    queryFn: () => fetchSignalsByWeek(weekStart!),
    enabled: !!weekStart,
    staleTime: 1000 * 60 * 5, // 5 min — signals don't change mid-session
    retry: 2,
  });
}

/**
 * Fetch the list of available weeks for the WeekSelector.
 */
export function useAvailableWeeks() {
  return useQuery<WeeksListResponse>({
    queryKey: signalKeys.weeks(),
    queryFn: fetchAvailableWeeks,
    staleTime: 1000 * 60 * 30,
  });
}
