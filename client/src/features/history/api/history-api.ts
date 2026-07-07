import axios from "@/lib/axios";
import type { ApiEnvelope } from "@/lib/api";
import { type ClosedTrade } from "../types/history.types";
import { mockClosedTrades } from "./history-mock";

/* Backend (trade-edge-api) uses `id`; the UI keys on `_id`. */
type BackendTrade = Omit<ClosedTrade, "_id"> & { id: string };

export async function getClosedTrades(useMock = false): Promise<ClosedTrade[]> {
  if (useMock) {
    return Promise.resolve(mockClosedTrades);
  }
  const { data } = await axios.get<ApiEnvelope<BackendTrade[]>>("/trades");
  return data.data.map((t) => ({ ...t, _id: t.id }));
}
