import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createBatch,
  uploadSignals,
  fetchSignals,
  fetchScannerStats,
} from "../api/scanner-api";
import type { UploadRow } from "../types/scanner.types";
import type { ScannerSignal, ScannerStats } from "../types/scanner.types";

export const scannerKeys = {
  all: ["scanner"] as const,
  signals: () => ["scanner", "signals"] as const,
  stats: () => ["scanner", "stats"] as const,
};

export function useScannerSignals() {
  return useQuery<ScannerSignal[]>({
    queryKey: scannerKeys.signals(),
    queryFn: () => fetchSignals(),
    staleTime: 1000 * 60,
  });
}

export function useScannerStats() {
  return useQuery<ScannerStats>({
    queryKey: scannerKeys.stats(),
    queryFn: fetchScannerStats,
    staleTime: 1000 * 60,
  });
}

export function useCreateBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createBatch,
    onSuccess: () => qc.invalidateQueries({ queryKey: scannerKeys.all }),
  });
}

export function useUploadSignals() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      rows,
      scanName,
      note,
    }: {
      rows: UploadRow[];
      scanName: string;
      note?: string;
    }) => uploadSignals(rows, scanName, note),
    onSuccess: () => qc.invalidateQueries({ queryKey: scannerKeys.all }),
  });
}
