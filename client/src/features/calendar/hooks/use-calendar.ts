import { useQuery } from "@tanstack/react-query";
import { fetchCalendar, fetchCalendarBenchmarks } from "../api/calendar-api";

export const calendarKeys = {
  month: (year: number, month: number) => ["calendar", year, month] as const,
  benchmarks: (year: number, month: number) => ["calendar", "benchmarks", year, month] as const,
};

export function useCalendar(year: number, month: number) {
  return useQuery({
    queryKey: calendarKeys.month(year, month),
    queryFn: () => fetchCalendar(year, month),
    staleTime: 1000 * 60 * 2,
  });
}

export function useCalendarBenchmarks(year: number, month: number) {
  return useQuery({
    queryKey: calendarKeys.benchmarks(year, month),
    queryFn: () => fetchCalendarBenchmarks(year, month),
    staleTime: 1000 * 60 * 5,
  });
}
