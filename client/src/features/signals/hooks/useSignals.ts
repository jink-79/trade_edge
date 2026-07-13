import { useQuery } from "@tanstack/react-query";
import { fetchWeeklySignals } from "../api/signals-api";
import type {
  EnrichedSignal,
  SignalStock,
  SignalsResponse,
  SignalStrength,
} from "../types/signals.types";

export const signalKeys = {
  all: ["signals"] as const,
  weeks: (n: number) => ["signals", "weeks", n] as const,
};

function strengthOf(volumeRatio: number): SignalStrength {
  if (volumeRatio >= 2) return "strong";
  if (volumeRatio >= 1.5) return "moderate";
  return "weak";
}

export function enrichSignal(s: SignalStock): EnrichedSignal {
  const volumeRatio = s.avg_volume_20 > 0 ? s.volume / s.avg_volume_20 : 0;
  const aboveBreakoutPct =
    s.breakout_level > 0
      ? ((s.close - s.breakout_level) / s.breakout_level) * 100
      : 0;
  return {
    ...s,
    volumeRatio,
    aboveBreakoutPct,
    strength: strengthOf(volumeRatio),
  };
}

export function useWeeklySignals(weeks = 8) {
  return useQuery<SignalsResponse>({
    queryKey: signalKeys.weeks(weeks),
    queryFn: () => fetchWeeklySignals(weeks),
    staleTime: 1000 * 60 * 5,
  });
}
