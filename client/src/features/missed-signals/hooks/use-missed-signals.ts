import { useQuery } from "@tanstack/react-query";
import { fetchMissedSignals } from "../api/missed-signals-api";
import type { MissedSignalsResponse } from "../types/missed-signals.types";

export function useMissedSignals(days: number) {
  return useQuery<MissedSignalsResponse>({
    queryKey: ["missed-signals", days],
    queryFn: () => fetchMissedSignals(days),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}
