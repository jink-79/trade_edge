import axiosInstance from "@/lib/axios";
import type { ApiEnvelope } from "@/lib/api";
import type { MissedSignalsResponse } from "../types/missed-signals.types";

export async function fetchMissedSignals(days: number): Promise<MissedSignalsResponse> {
  const { data } = await axiosInstance.get<ApiEnvelope<MissedSignalsResponse>>("/missed-signals", {
    params: { days },
  });
  return data.data;
}
