import axiosInstance from "@/lib/axios";
import type { ApiEnvelope } from "@/lib/api";
import type { DailyPnlSnapshot } from "../types/daily-pnl.types";

export async function fetchLatestDailyPnl(): Promise<DailyPnlSnapshot | null> {
  const { data } =
    await axiosInstance.get<ApiEnvelope<DailyPnlSnapshot | null>>("/broker-sync/daily-pnl/latest");
  return data.data;
}

export async function fetchDailyPnlHistory(range?: {
  from?: string;
  to?: string;
  limit?: number;
}): Promise<DailyPnlSnapshot[]> {
  const { data } = await axiosInstance.get<ApiEnvelope<DailyPnlSnapshot[]>>("/broker-sync/daily-pnl", {
    params: range,
  });
  return data.data ?? [];
}
