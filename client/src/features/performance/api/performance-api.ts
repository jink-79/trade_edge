import axiosInstance from "@/lib/axios";
import type { ApiEnvelope } from "@/lib/api";
import type { Performance } from "../types/performance.types";

export async function fetchPerformance(): Promise<Performance | null> {
  const { data } =
    await axiosInstance.get<ApiEnvelope<Performance | null>>(
      "/scanner/performance",
    );
  return data.data;
}
