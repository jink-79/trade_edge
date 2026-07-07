import axiosInstance from "@/lib/axios";
import type { ApiEnvelope } from "@/lib/api";
import type {
  Position,
  CreatePositionPayload,
  ExitPositionPayload,
  ExitResult,
} from "../types/positions.types";

/* Backend sends `id`; the UI keys on `_id`. */
type BackendPosition = Omit<Position, "_id"> & { id: string };

function toPosition(p: BackendPosition): Position {
  return { ...p, _id: p.id };
}

export async function fetchPositions(): Promise<Position[]> {
  const { data } =
    await axiosInstance.get<ApiEnvelope<BackendPosition[]>>("/positions");
  return data.data.map(toPosition);
}

export async function createPosition(
  payload: CreatePositionPayload,
): Promise<Position> {
  const { data } = await axiosInstance.post<ApiEnvelope<BackendPosition>>(
    "/positions",
    payload,
  );
  return toPosition(data.data);
}

/** Closes a position and moves it into the closed-trades (history) collection. */
export async function exitPosition(
  id: string,
  payload: ExitPositionPayload,
): Promise<ExitResult> {
  const { data } = await axiosInstance.post<ApiEnvelope<ExitResult>>(
    `/positions/${id}/exit`,
    payload,
  );
  return data.data;
}
