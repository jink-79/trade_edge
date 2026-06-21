import axios from "axios";
import type {
  SignalsWeekResponse,
  WeeksListResponse,
} from "../types/signals.types";

/**
 * Fetch all signals for a given week.
 * @param weekStart - Monday of the week in "YYYY-MM-DD" format
 */
export async function fetchSignalsByWeek(
  weekStart: string,
): Promise<SignalsWeekResponse> {
  const { data } = await axios.get<SignalsWeekResponse>("/signals", {
    params: { week: weekStart },
  });
  return data;
}

/**
 * Fetch the list of available weeks (last 8).
 * Used to populate the WeekSelector.
 */
export async function fetchAvailableWeeks(): Promise<WeeksListResponse> {
  const { data } = await axios.get<WeeksListResponse>("/signals/weeks");
  return data;
}
