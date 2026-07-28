import axiosInstance from "@/lib/axios";
import type { ApiEnvelope } from "@/lib/api";
import type {
  ExitTradePayload,
  JournalTrade,
  NewTradePayload,
  ReviewPayload,
} from "../types/journal.types";

export async function createJournalTrade(
  payload: NewTradePayload,
): Promise<JournalTrade> {
  const { data } = await axiosInstance.post<ApiEnvelope<JournalTrade>>(
    "/journal",
    payload,
  );
  return data.data;
}

/** List — screenshots are excluded server-side to keep the payload light. */
export async function fetchJournalTrades(): Promise<JournalTrade[]> {
  const { data } =
    await axiosInstance.get<ApiEnvelope<JournalTrade[]>>("/journal");
  return data.data;
}

export async function fetchJournalTrade(id: string): Promise<JournalTrade> {
  const { data } = await axiosInstance.get<ApiEnvelope<JournalTrade>>(
    `/journal/${id}`,
  );
  return data.data;
}

export async function exitJournalTrade(
  id: string,
  payload: ExitTradePayload,
): Promise<JournalTrade> {
  const { data } = await axiosInstance.post<ApiEnvelope<JournalTrade>>(
    `/journal/${id}/exit`,
    payload,
  );
  return data.data;
}

export async function reviewJournalTrade(
  id: string,
  payload: ReviewPayload,
): Promise<JournalTrade> {
  const { data } = await axiosInstance.post<ApiEnvelope<JournalTrade>>(
    `/journal/${id}/review`,
    payload,
  );
  return data.data;
}

export async function setGttPlaced(
  id: string,
  placed: boolean,
): Promise<JournalTrade> {
  const { data } = await axiosInstance.post<ApiEnvelope<JournalTrade>>(
    `/journal/${id}/gtt`,
    { placed },
  );
  return data.data;
}
