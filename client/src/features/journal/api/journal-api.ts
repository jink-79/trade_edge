import axiosInstance from "@/lib/axios";
import type { ApiEnvelope } from "@/lib/api";
import type {
  ExitTradePayload,
  JournalTrade,
  NewTradePayload,
  Outcome,
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

export interface TradeChartCandle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TradeChartData {
  symbol: string;
  candles: TradeChartCandle[];
  /** RS-55 (% vs Nifty) at every bar in `candles`, same index alignment —
   * null where there isn't 55 bars of lookback yet. */
  rsSeries: (number | null)[];
  entryDate: string;
  entryPrice: number;
  exitDate: string | null;
  exitPrice: number | null;
}

/** ~60 daily bars before entry through exit/now, for the trade-detail
 * candlestick chart. */
export async function fetchTradeChart(id: string): Promise<TradeChartData> {
  const { data } = await axiosInstance.get<ApiEnvelope<TradeChartData>>(
    `/journal/${id}/chart`,
  );
  return data.data;
}

export interface StrengthComponent {
  score: number;
  detail: string;
}

export interface StockStrength {
  score: number;
  label: "Strong" | "Neutral" | "Weak";
  asOfDate: string;
  niftyRegime: "up" | "down";
  components: {
    trendAlignment: StrengthComponent;
    emaDistance: StrengthComponent;
    relativeStrength: StrengthComponent;
    volatility: StrengthComponent;
    momentum: StrengthComponent;
    volume: StrengthComponent;
  };
}

/** Technical (non-AI) strength scorecard for this trade's symbol, evaluated
 * on the latest available OHLCV — reflects the stock's current state. */
export async function fetchStockStrength(id: string): Promise<StockStrength> {
  const { data } = await axiosInstance.get<ApiEnvelope<StockStrength>>(
    `/journal/${id}/strength`,
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

/** Generates (or regenerates) the AI review of a closed trade against the
 * strategy's own rules, and persists it on the trade. */
export async function generateTradeInsight(id: string): Promise<JournalTrade> {
  const { data } = await axiosInstance.post<ApiEnvelope<JournalTrade>>(
    `/journal/${id}/insight`,
  );
  return data.data;
}

export interface ExitSummaryPayload {
  outcome: Exclude<Outcome, "STILL-OPEN">;
  exitPrice: number;
  exitDate: string;
  quantity?: number;
}

/** On-demand AI exit note for a draft exit — not persisted until the real
 * exit is submitted with this text as `aiAnalysis`. */
export async function fetchExitSummary(
  id: string,
  payload: ExitSummaryPayload,
): Promise<{ summary: string }> {
  const { data } = await axiosInstance.post<ApiEnvelope<{ summary: string }>>(
    `/journal/${id}/exit-summary`,
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

/** On-demand AI take on a held position — not cached server-side, fetched
 * fresh each time the user asks. */
export async function fetchAiReview(id: string): Promise<{ aiReview: string }> {
  const { data } = await axiosInstance.post<ApiEnvelope<{ aiReview: string }>>(
    `/journal/${id}/ai-review`,
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
