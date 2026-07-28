import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createJournalTrade,
  fetchJournalTrades,
  exitJournalTrade,
  reviewJournalTrade,
  setGttPlaced,
} from "../api/journal-api";
import type {
  ExitTradePayload,
  JournalTrade,
  ReviewPayload,
} from "../types/journal.types";

export const journalKeys = {
  all: ["journal"] as const,
  list: () => ["journal", "list"] as const,
};

export function useJournalTrades() {
  return useQuery<JournalTrade[]>({
    queryKey: journalKeys.list(),
    queryFn: fetchJournalTrades,
    staleTime: 1000 * 60,
  });
}

export function useCreateJournalTrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createJournalTrade,
    onSuccess: () => qc.invalidateQueries({ queryKey: journalKeys.all }),
  });
}

export function useExitJournalTrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ExitTradePayload }) =>
      exitJournalTrade(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: journalKeys.all }),
  });
}

export function useReviewJournalTrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ReviewPayload }) =>
      reviewJournalTrade(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: journalKeys.all }),
  });
}

export function useSetGttPlaced() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, placed }: { id: string; placed: boolean }) =>
      setGttPlaced(id, placed),
    onSuccess: () => qc.invalidateQueries({ queryKey: journalKeys.all }),
  });
}
