import axiosInstance from "@/lib/axios";
import type { ApiEnvelope } from "@/lib/api";
import type { CalendarResponse, CalendarBenchmarkResponse } from "../types/calendar.types";

/** `month` is 0-indexed to match JS Date / the page's cursor state. */
export async function fetchCalendar(year: number, month: number): Promise<CalendarResponse> {
  const { data } = await axiosInstance.get<ApiEnvelope<CalendarResponse>>("/calendar", {
    params: { year, month },
  });
  return data.data;
}

export async function fetchCalendarBenchmarks(
  year: number,
  month: number,
): Promise<CalendarBenchmarkResponse> {
  const { data } = await axiosInstance.get<ApiEnvelope<CalendarBenchmarkResponse>>(
    "/calendar/benchmarks",
    { params: { year, month } },
  );
  return data.data;
}
