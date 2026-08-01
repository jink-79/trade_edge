import axiosInstance from "@/lib/axios";
import type { ApiEnvelope } from "@/lib/api";
import type {
  PulseRun,
  PulsePerformance,
  PulseWeekSummary,
  PulseWeek,
} from "../types/pulse.types";

export async function fetchPulseScan(): Promise<PulseRun | null> {
  const { data } =
    await axiosInstance.get<ApiEnvelope<PulseRun | null>>("/pulse/scan");
  return data.data;
}

export async function fetchPulsePerformance(): Promise<PulsePerformance[]> {
  const { data } =
    await axiosInstance.get<ApiEnvelope<PulsePerformance[]>>("/pulse/performance");
  return data.data ?? [];
}

export async function fetchPulseWeeks(
  variant: string,
): Promise<PulseWeekSummary[]> {
  const { data } = await axiosInstance.get<ApiEnvelope<PulseWeekSummary[]>>(
    "/pulse/weeks",
    { params: { variant } },
  );
  return data.data ?? [];
}

export async function fetchPulseWeekByDate(
  variant: string,
  date: string,
): Promise<PulseWeek | null> {
  const { data } = await axiosInstance.get<ApiEnvelope<PulseWeek | null>>(
    `/pulse/weeks/${date}`,
    { params: { variant } },
  );
  return data.data;
}
