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

export interface ManualEntryPayload {
  symbol: string;
  entryPrice: number;
  quantity: number;
  entryDate?: string;
}

/** Trend+RS-55 manual open — candles are fetched server-side from
 * phalanx-live's own OHLCV, no Kite session needed. */
export async function createManualEntry(
  payload: ManualEntryPayload,
): Promise<JournalTrade> {
  const { data } = await axiosInstance.post<ApiEnvelope<JournalTrade>>(
    "/journal/entries",
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

/** Candle shape accepted by the analytics endpoint. */
export interface AnalyzeCandle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export async function analyzeTrade(
  id: string,
  candles: AnalyzeCandle[],
): Promise<JournalTrade> {
  const { data } = await axiosInstance.post<ApiEnvelope<JournalTrade>>(
    `/journal/${id}/analytics`,
    { candles },
  );
  return data.data;
}

export async function setRuleAdherence(
  id: string,
  payload: {
    ruleAdherence: "system" | "discretionary" | null;
    ruleAdherenceNote?: string;
  },
): Promise<JournalTrade> {
  const { data } = await axiosInstance.post<ApiEnvelope<JournalTrade>>(
    `/journal/${id}/adherence`,
    payload,
  );
  return data.data;
}
