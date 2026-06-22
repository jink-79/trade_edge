import axios from "axios";
import type { PositionsResponse } from "../types/positions.types";

export async function fetchPositions(): Promise<PositionsResponse> {
  const { data } = await axios.get<PositionsResponse>("/positions");
  return data;
}
