import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchWeeklyRecap, generateWeeklyRecap } from "../api/overview-api";
import type { WeeklyRecapResponse } from "../types/overview.types";

export const overviewKeys = {
  recap: (weekStart: string) => ["weekly-recap", weekStart] as const,
};

export function useWeeklyRecap(weekStart: string) {
  return useQuery<WeeklyRecapResponse>({
    queryKey: overviewKeys.recap(weekStart),
    queryFn: () => fetchWeeklyRecap(weekStart),
    staleTime: 1000 * 60 * 2,
  });
}

export function useGenerateWeeklyRecap(weekStart: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => generateWeeklyRecap(weekStart),
    onSuccess: (data) => qc.setQueryData(overviewKeys.recap(weekStart), data),
  });
}
