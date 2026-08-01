import { useQuery } from "@tanstack/react-query";
import { fetchPerformance } from "../api/performance-api";
import type { Performance } from "../types/performance.types";

export function usePerformance() {
  return useQuery<Performance | null>({
    queryKey: ["scanner", "performance"],
    queryFn: fetchPerformance,
    staleTime: 1000 * 60,
  });
}
