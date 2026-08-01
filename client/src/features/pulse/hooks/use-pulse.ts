import { useQuery } from "@tanstack/react-query";
import {
  fetchPulseScan,
  fetchPulsePerformance,
  fetchPulseWeeks,
  fetchPulseWeekByDate,
} from "../api/pulse-api";
import type {
  PulseRun,
  PulsePerformance,
  PulseWeekSummary,
  PulseWeek,
} from "../types/pulse.types";

export function usePulseScan() {
  return useQuery<PulseRun | null>({
    queryKey: ["pulse", "scan"],
    queryFn: fetchPulseScan,
    staleTime: 1000 * 60,
  });
}

export function usePulsePerformance() {
  return useQuery<PulsePerformance[]>({
    queryKey: ["pulse", "performance"],
    queryFn: fetchPulsePerformance,
    staleTime: 1000 * 60,
  });
}

export function usePulseWeeks(variant: string) {
  return useQuery<PulseWeekSummary[]>({
    queryKey: ["pulse", "weeks", variant],
    queryFn: () => fetchPulseWeeks(variant),
    enabled: !!variant,
    staleTime: 1000 * 60,
  });
}

export function usePulseWeekByDate(variant: string, date: string) {
  return useQuery<PulseWeek | null>({
    queryKey: ["pulse", "week", variant, date],
    queryFn: () => fetchPulseWeekByDate(variant, date),
    enabled: !!variant && !!date,
    staleTime: 1000 * 60,
  });
}
