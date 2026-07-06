import { useQuery } from "@tanstack/react-query";
import { fetchAnalytics } from "../api/analytics-api";
import type { AnalyticsResponse, Range } from "../types/analytics.types";

export const analyticsKeys = {
  all: ["analytics"] as const,
  byRange: (range: Range) => ["analytics", range] as const,
};

export function useAnalytics(range: Range) {
  return useQuery<AnalyticsResponse>({
    queryKey: analyticsKeys.byRange(range),
    queryFn: () => fetchAnalytics(range),
    staleTime: 1000 * 60 * 5,
  });
}
