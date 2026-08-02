import axiosInstance from "@/lib/axios";
import type { ApiEnvelope } from "@/lib/api";
import type {
  BacktestMetrics,
  GroupBreakdownRow,
  ReportUniverse,
  SymbolScorecardRow,
  TradeLogRow,
} from "../types/report.types";

export interface ArchiveStrategySummary {
  strategyName: string;
  versions: number;
  latestUpload: string;
}

export interface ArchiveVersionSummary {
  version: string;
  universe: ReportUniverse;
  status: "adopted" | "rejected" | "superseded" | "diagnostic" | null;
  supersedes: string | null;
  date: string | null;
  uploadedAt: string;
}

export interface ArchiveReport {
  userId: string;
  strategyName: string;
  version: string;
  universe: ReportUniverse;
  status: "adopted" | "rejected" | "superseded" | "diagnostic" | null;
  supersedes: string | null;
  date: string | null;
  mdBody: string | null;
  metrics: BacktestMetrics;
  sourceFiles: { xlsx: string | null; csv: string | null; md: string | null };
  uploadedAt: string;
}

export interface PagedRows<T> {
  total: number;
  page: number;
  pageSize: number;
  rows: T[];
}

const enc = encodeURIComponent;

export async function fetchArchiveStrategies(): Promise<ArchiveStrategySummary[]> {
  const { data } =
    await axiosInstance.get<ApiEnvelope<ArchiveStrategySummary[]>>("/backtest-archive/strategies");
  return data.data ?? [];
}

export async function fetchArchiveVersions(strategyName: string): Promise<ArchiveVersionSummary[]> {
  const { data } = await axiosInstance.get<ApiEnvelope<ArchiveVersionSummary[]>>(
    `/backtest-archive/${enc(strategyName)}/versions`,
  );
  return data.data ?? [];
}

export async function fetchArchiveReport(
  strategyName: string,
  version: string,
  universe: string,
): Promise<ArchiveReport | null> {
  try {
    const { data } = await axiosInstance.get<ApiEnvelope<ArchiveReport>>(
      `/backtest-archive/${enc(strategyName)}/${enc(version)}/${enc(universe)}`,
    );
    return data.data;
  } catch {
    return null;
  }
}

export async function fetchArchiveSymbolScorecard(
  strategyName: string,
  version: string,
  universe: string,
  params: { page?: number; pageSize?: number; q?: string; verdict?: string } = {},
): Promise<PagedRows<SymbolScorecardRow> | null> {
  try {
    const { data } = await axiosInstance.get<ApiEnvelope<PagedRows<SymbolScorecardRow>>>(
      `/backtest-archive/${enc(strategyName)}/${enc(version)}/${enc(universe)}/symbol-scorecard`,
      { params },
    );
    return data.data;
  } catch {
    return null;
  }
}

export async function fetchArchiveTradeLog(
  strategyName: string,
  version: string,
  universe: string,
  params: { page?: number; pageSize?: number; symbol?: string } = {},
): Promise<PagedRows<TradeLogRow>> {
  const { data } = await axiosInstance.get<ApiEnvelope<PagedRows<TradeLogRow>>>(
    `/backtest-archive/${enc(strategyName)}/${enc(version)}/${enc(universe)}/trade-log`,
    { params },
  );
  return data.data ?? { total: 0, page: 1, pageSize: params.pageSize ?? 100, rows: [] };
}

export interface UploadArchiveInput {
  strategyName: string;
  version: string;
  universe: ReportUniverse;
  xlsx: File;
  md: File;
  csv?: File | null;
}

export async function uploadArchive(input: UploadArchiveInput): Promise<ArchiveReport> {
  const form = new FormData();
  form.append("strategyName", input.strategyName);
  form.append("version", input.version);
  form.append("universe", input.universe);
  form.append("xlsx", input.xlsx);
  form.append("md", input.md);
  if (input.csv) form.append("csv", input.csv);

  const { data } = await axiosInstance.post<ApiEnvelope<ArchiveReport>>(
    "/backtest-archive/upload",
    form,
    // axiosInstance defaults Content-Type to application/json; overriding it
    // to undefined here lets axios detect the FormData body itself and set
    // multipart/form-data with the correct boundary — without this, the
    // request goes out as "application/json" with a multipart body, multer
    // never recognizes it, and req.files comes back empty (the actual cause
    // of "Missing required file: xlsx" even when a file was selected).
    { headers: { "Content-Type": undefined } },
  );
  return data.data;
}

export async function deleteArchiveReport(
  strategyName: string,
  version: string,
  universe: string,
): Promise<void> {
  await axiosInstance.delete(
    `/backtest-archive/${enc(strategyName)}/${enc(version)}/${enc(universe)}`,
  );
}

export async function fetchArchiveBreakdown(
  strategyName: string,
  version: string,
  universe: string,
  group: "sector" | "marketCap",
): Promise<GroupBreakdownRow[]> {
  const { data } = await axiosInstance.get<ApiEnvelope<GroupBreakdownRow[]>>(
    `/backtest-archive/${enc(strategyName)}/${enc(version)}/${enc(universe)}/breakdown`,
    { params: { group } },
  );
  return data.data ?? [];
}
