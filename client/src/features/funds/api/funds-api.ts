import axios from "axios";
import type { FundsResponse, AddFundPayload, Fund } from "../types/funds.types";

export async function fetchFunds(): Promise<FundsResponse> {
  const { data } = await axios.get<FundsResponse>("/funds");
  return data;
}

export async function addFund(payload: AddFundPayload): Promise<Fund> {
  const { data } = await axios.post<{ success: boolean; data: Fund }>(
    "/funds",
    payload,
  );
  return data.data;
}

export async function deleteFund(id: string): Promise<void> {
  await axios.delete(`/funds/${id}`);
}
