import axiosInstance from "@/lib/axios";
import type { ApiEnvelope } from "@/lib/api";
import type {
  PulseRun,
  PulsePerformance,
  PulseWeekSummary,
  PulseWeek,
  ScorecardUniverse,
  SymbolScorecardSnapshot,
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
  range?: { from?: string; to?: string },
): Promise<PulseWeekSummary[]> {
  const { data } = await axiosInstance.get<ApiEnvelope<PulseWeekSummary[]>>(
    "/pulse/weeks",
    { params: { variant, from: range?.from, to: range?.to } },
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

export async function fetchSymbolScorecard(
  variant: ScorecardUniverse,
): Promise<SymbolScorecardSnapshot | null> {
  const { data } = await axiosInstance.get<ApiEnvelope<SymbolScorecardSnapshot | null>>(
    "/pulse/symbol-stats",
    { params: { variant } },
  );
  return data.data;
}

export interface PulseVariantSummary {
  variant: string;
  label: string | null;
  asOf: string | null;
  tradeCount: number;
  sampleWarning: string | null;
  metrics: Record<string, unknown> | null;
}

export async function fetchPulseVariants(): Promise<PulseVariantSummary[]> {
  const { data } =
    await axiosInstance.get<ApiEnvelope<PulseVariantSummary[]>>("/pulse/variants");
  return data.data ?? [];
}
