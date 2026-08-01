import { useQuery } from "@tanstack/react-query";
import { fetchSignalsByDate } from "@/features/scanner/api/scanner-api";
import type { ScannerSignal } from "@/features/scanner/types/scanner.types";

export function useSignalsByDate(date: string) {
  return useQuery<ScannerSignal[]>({
    queryKey: ["scanner", "signals", "date", date],
    queryFn: () => fetchSignalsByDate(date),
    staleTime: 1000 * 60,
  });
}
