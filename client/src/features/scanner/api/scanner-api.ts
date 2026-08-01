import axiosInstance from "@/lib/axios";
import type { ApiEnvelope } from "@/lib/api";
import type {
  CreateBatchPayload,
  CreateBatchResult,
  ScannerSignal,
  ScannerStats,
  UploadResult,
  UploadRow,
} from "../types/scanner.types";

export async function createBatch(
  payload: CreateBatchPayload,
): Promise<CreateBatchResult> {
  const { data } = await axiosInstance.post<ApiEnvelope<CreateBatchResult>>(
    "/scanner/batch",
    payload,
  );
  return data.data;
}

export async function uploadSignals(
  rows: UploadRow[],
  scanName: string,
  note?: string,
): Promise<UploadResult> {
  const { data } = await axiosInstance.post<ApiEnvelope<UploadResult>>(
    "/scanner/upload",
    { rows, note, scanName, source: "chartink-upload" },
  );
  return data.data;
}

export async function fetchSignals(params?: {
  status?: string;
  batchId?: string;
}): Promise<ScannerSignal[]> {
  const { data } = await axiosInstance.get<ApiEnvelope<ScannerSignal[]>>(
    "/scanner/signals",
    { params },
  );
  return data.data;
}

export async function fetchSignalsByDate(
  date: string,
): Promise<ScannerSignal[]> {
  const { data } = await axiosInstance.get<ApiEnvelope<ScannerSignal[]>>(
    "/scanner/signals",
    { params: { date } },
  );
  return data.data;
}

export async function fetchScannerStats(): Promise<ScannerStats> {
  const { data } =
    await axiosInstance.get<ApiEnvelope<ScannerStats>>("/scanner/stats");
  return data.data;
}

/** Supply candles for a signal (agent now; Python courier later). */
export interface EnrichCandle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export async function enrichSignal(
  id: string,
  candles: EnrichCandle[],
  indexCandles: EnrichCandle[] = [],
): Promise<ScannerSignal> {
  const { data } = await axiosInstance.post<ApiEnvelope<ScannerSignal>>(
    `/scanner/signals/${id}/enrich`,
    { candles, indexCandles },
  );
  return data.data;
}
