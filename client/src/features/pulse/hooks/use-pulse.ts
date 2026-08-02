import { useQuery } from "@tanstack/react-query";
import {
  fetchPulseScan,
  fetchPulsePerformance,
  fetchPulseWeeks,
  fetchPulseWeekByDate,
  fetchSymbolScorecard,
  fetchPulseVariants,
  type PulseVariantSummary,
} from "../api/pulse-api";
import type {
  PulseRun,
  PulsePerformance,
  PulseWeekSummary,
  PulseWeek,
  ScorecardUniverse,
  SymbolScorecardSnapshot,
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

export function usePulseWeeks(variant: string, range?: { from?: string; to?: string }) {
  return useQuery<PulseWeekSummary[]>({
    queryKey: ["pulse", "weeks", variant, range?.from, range?.to],
    queryFn: () => fetchPulseWeeks(variant, range),
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

export function useSymbolScorecard(variant: ScorecardUniverse) {
  return useQuery<SymbolScorecardSnapshot | null>({
    queryKey: ["pulse", "symbol-scorecard", variant],
    queryFn: () => fetchSymbolScorecard(variant),
    staleTime: 1000 * 60,
  });
}

export function usePulseVariants() {
  return useQuery<PulseVariantSummary[]>({
    queryKey: ["pulse", "variants"],
    queryFn: fetchPulseVariants,
    staleTime: 1000 * 60,
  });
}
