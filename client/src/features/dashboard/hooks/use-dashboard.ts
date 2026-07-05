import { useQuery } from "@tanstack/react-query";
import { fetchDashboard } from "../api/dashboard-api";
import type { DashboardResponse } from "../types/dashboard.types";

export const dashboardKeys = {
  all: ["dashboard"] as const,
};

export function useDashboard() {
  return useQuery<DashboardResponse>({
    queryKey: dashboardKeys.all,
    queryFn: fetchDashboard,
    staleTime: 1000 * 60 * 2,
  });
}
