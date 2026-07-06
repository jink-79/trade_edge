import axiosInstance from "@/lib/axios";
import type { ApiEnvelope } from "@/lib/api";
import type { AnalyticsResponse, Range } from "../types/analytics.types";

export async function fetchAnalytics(range: Range): Promise<AnalyticsResponse> {
  const { data } = await axiosInstance.get<ApiEnvelope<AnalyticsResponse>>(
    "/analytics",
    { params: { range } },
  );
  return data.data;
}
