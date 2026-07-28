import axiosInstance from "@/lib/axios";
import type { ApiEnvelope } from "@/lib/api";
import type { TradingPreferences } from "../types/preferences.types";

export async function fetchPreferences(): Promise<TradingPreferences> {
  const { data } =
    await axiosInstance.get<ApiEnvelope<TradingPreferences>>("/preferences");
  return data.data;
}

export async function savePreferences(
  payload: TradingPreferences,
): Promise<TradingPreferences> {
  const { data } = await axiosInstance.put<ApiEnvelope<TradingPreferences>>(
    "/preferences",
    payload,
  );
  return data.data;
}
