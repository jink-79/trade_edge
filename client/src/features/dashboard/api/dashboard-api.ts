import axiosInstance from "@/lib/axios";
import type { ApiEnvelope } from "@/lib/api";
import type { DashboardResponse } from "../types/dashboard.types";

export async function fetchDashboard(): Promise<DashboardResponse> {
  const { data } =
    await axiosInstance.get<ApiEnvelope<DashboardResponse>>("/dashboard");
  return data.data;
}
