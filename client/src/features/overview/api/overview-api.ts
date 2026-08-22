import axiosInstance from "@/lib/axios";
import type { ApiEnvelope } from "@/lib/api";
import type { WeeklyRecapResponse } from "../types/overview.types";

/** `weekStart`: any date (yyyy-mm-dd) within the target week — the backend
 * snaps it to that week's real Monday. */
export async function fetchWeeklyRecap(weekStart: string): Promise<WeeklyRecapResponse> {
  const { data } = await axiosInstance.get<ApiEnvelope<WeeklyRecapResponse>>("/weekly-recap", {
    params: { weekStart },
  });
  return data.data;
}

export async function generateWeeklyRecap(weekStart: string): Promise<WeeklyRecapResponse> {
  const { data } = await axiosInstance.post<ApiEnvelope<WeeklyRecapResponse>>(
    "/weekly-recap/generate",
    undefined,
    { params: { weekStart } },
  );
  return data.data;
}
