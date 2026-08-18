import axiosInstance from "@/lib/axios";
import type { ApiEnvelope } from "@/lib/api";
import type { DailySignalDoc, WeeklySignalDoc } from "../types/algo-signals.types";

export async function fetchLatestDailySignal(): Promise<DailySignalDoc | null> {
  const { data } =
    await axiosInstance.get<ApiEnvelope<DailySignalDoc | null>>("/algo-signals/daily/latest");
  return data.data;
}

export async function fetchDailySignals(range?: {
  from?: string;
  to?: string;
  limit?: number;
}): Promise<DailySignalDoc[]> {
  const { data } = await axiosInstance.get<ApiEnvelope<DailySignalDoc[]>>("/algo-signals/daily", {
    params: range,
  });
  return data.data ?? [];
}

export async function fetchLatestWeeklySignal(): Promise<WeeklySignalDoc | null> {
  const { data } =
    await axiosInstance.get<ApiEnvelope<WeeklySignalDoc | null>>("/algo-signals/weekly/latest");
  return data.data;
}

export async function fetchWeeklySignals(range?: {
  from?: string;
  to?: string;
  limit?: number;
}): Promise<WeeklySignalDoc[]> {
  const { data } = await axiosInstance.get<ApiEnvelope<WeeklySignalDoc[]>>("/algo-signals/weekly", {
    params: range,
  });
  return data.data ?? [];
}
