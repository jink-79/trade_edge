import axiosInstance from "@/lib/axios";
import type { ApiEnvelope, Paginated } from "@/lib/api";
import {
  type FundCategory,
  type MutualFundEntry,
  type NewFundEntryPayload,
} from "../types/mutual-funds.types";

/* ── backend shape (trade-edge-api uses `id`; the UI keys on `_id`) ── */
interface BackendMutualFund {
  id: string;
  date: string;
  fundName: string;
  category: string;
  nav: number;
  units: number;
  amount: number;
}

/** Max page size accepted by the API (see MutualFundsQuerySchema). */
const MAX_LIMIT = 100;

function toEntry(e: BackendMutualFund): MutualFundEntry {
  return {
    _id: e.id,
    date: e.date,
    fundName: e.fundName,
    category: e.category as FundCategory,
    nav: e.nav,
    units: e.units,
    amount: e.amount,
  };
}

async function fetchPage(
  page: number,
): Promise<ApiEnvelope<Paginated<BackendMutualFund>>["data"]> {
  const { data } = await axiosInstance.get<
    ApiEnvelope<Paginated<BackendMutualFund>>
  >("/mutual-funds", { params: { page, limit: MAX_LIMIT } });
  return data.data;
}

/**
 * Fetches every mutual-fund transaction. The API paginates (100/page), but the
 * page computes summary / sort / pagination client-side, so we pull all pages.
 */
export async function fetchMutualFunds(): Promise<MutualFundEntry[]> {
  const first = await fetchPage(1);
  const all = [...first.entries];

  if (first.totalPages > 1) {
    const rest = await Promise.all(
      Array.from({ length: first.totalPages - 1 }, (_, i) => fetchPage(i + 2)),
    );
    rest.forEach((p) => all.push(...p.entries));
  }

  return all.map(toEntry);
}

/**
 * Persists a new entry via POST /api/mutual-funds and returns it mapped to the
 * UI shape. The new row is stamped with the current user's id server-side.
 */
export async function createMutualFundEntry(
  payload: NewFundEntryPayload,
): Promise<MutualFundEntry> {
  const { data } = await axiosInstance.post<ApiEnvelope<BackendMutualFund>>(
    "/mutual-funds",
    payload,
  );
  return toEntry(data.data);
}
