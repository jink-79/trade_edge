import axios from "@/lib/axios";
import { type ClosedTrade } from "../types/history.types";
import { mockClosedTrades } from "./history-mock";

export async function getClosedTrades(useMock = false): Promise<ClosedTrade[]> {
  if (useMock) {
    return Promise.resolve(mockClosedTrades);
  }
  const response = await axios.get<ClosedTrade[]>("/api/trades/history");
  return response.data;
}
