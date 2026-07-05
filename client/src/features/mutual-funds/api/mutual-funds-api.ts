import axiosInstance from "@/lib/axios";
import {
  type MutualFundEntry,
  type NewFundEntryPayload,
} from "../types/mutual-funds.types";
import { USE_MOCK } from "./mutual-funds-mock";

export async function fetchMutualFunds(): Promise<MutualFundEntry[]> {
  const response = await axiosInstance.get<{
    success: boolean;
    data: MutualFundEntry[];
  }>("/mutual-funds");
  return response.data.data;
}

export async function createMutualFundEntry(
  payload: NewFundEntryPayload,
): Promise<MutualFundEntry> {
  if (USE_MOCK) {
    const mockCreatedEntry: MutualFundEntry = {
      _id: Math.random().toString(36).slice(2),
      ...payload,
    };
    return Promise.resolve(mockCreatedEntry);
  }

  const response = await axiosInstance.post<MutualFundEntry>(
    "/api/mutual-funds/entry",
    payload,
  );
  return response.data;
}
