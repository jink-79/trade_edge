import axiosInstance from "@/lib/axios";
import type { ApiEnvelope } from "@/lib/api";
import type { FundsResponse, AddFundPayload, Fund } from "../types/funds.types";

export async function fetchFunds(): Promise<FundsResponse> {
  const { data } = await axiosInstance.get<ApiEnvelope<FundsResponse>>("/funds");
  return data.data;
}

export async function addFund(payload: AddFundPayload): Promise<Fund> {
  const { data } = await axiosInstance.post<ApiEnvelope<Fund>>(
    "/funds",
    payload,
  );
  return data.data;
}

export async function deleteFund(id: string): Promise<void> {
  await axiosInstance.delete(`/funds/${id}`);
}
