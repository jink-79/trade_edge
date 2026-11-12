import axiosInstance from "@/lib/axios";
import type { ApiEnvelope } from "@/lib/api";
import type { Possession, PossessionPayload } from "../types/possessions.types";

export async function fetchPossessions(): Promise<Possession[]> {
  const { data } = await axiosInstance.get<ApiEnvelope<Possession[]>>("/possessions");
  return data.data;
}

export async function createPossession(payload: PossessionPayload): Promise<Possession> {
  const { data } = await axiosInstance.post<ApiEnvelope<Possession>>("/possessions", payload);
  return data.data;
}

export async function updatePossession(id: string, payload: Partial<PossessionPayload>): Promise<Possession> {
  const { data } = await axiosInstance.patch<ApiEnvelope<Possession>>(`/possessions/${id}`, payload);
  return data.data;
}

export async function deletePossession(id: string): Promise<void> {
  await axiosInstance.delete(`/possessions/${id}`);
}
