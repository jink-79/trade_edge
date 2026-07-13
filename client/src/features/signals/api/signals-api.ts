import axiosInstance from "@/lib/axios";
import type { ApiEnvelope } from "@/lib/api";
import type { SignalsResponse } from "../types/signals.types";

/**
 * Fetch the last N weeks of scanner signals (each week grouped with its stocks).
 */
export async function fetchWeeklySignals(
  weeks = 8,
): Promise<SignalsResponse> {
  const { data } = await axiosInstance.get<ApiEnvelope<SignalsResponse>>(
    "/signals/weekly-scanner",
    { params: { weeks } },
  );
  return data.data;
}
