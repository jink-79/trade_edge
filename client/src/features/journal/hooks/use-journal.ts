import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createJournalTrade,
  createManualEntry,
  fetchAiReview,
  fetchJournalTrades,
  fetchJournalTrade,
  exitJournalTrade,
  reviewJournalTrade,
  setGttPlaced,
  setRuleAdherence,
} from "../api/journal-api";
import type {
  ExitTradePayload,
  JournalTrade,
  ReviewPayload,
} from "../types/journal.types";

export const journalKeys = {
  all: ["journal"] as const,
  list: () => ["journal", "list"] as const,
  detail: (id: string) => ["journal", "detail", id] as const,
};

export function useJournalTrades() {
  return useQuery<JournalTrade[]>({
    queryKey: journalKeys.list(),
    queryFn: fetchJournalTrades,
    staleTime: 1000 * 60,
  });
}

/** Single trade WITH screenshots + AI analysis (the list omits those). */
export function useJournalTrade(id: string | undefined) {
  return useQuery<JournalTrade>({
    queryKey: journalKeys.detail(id ?? ""),
    queryFn: () => fetchJournalTrade(id as string),
    enabled: !!id,
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

export function useCreateManualEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createManualEntry,
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

export function useAiReview() {
  return useMutation({
    mutationFn: (id: string) => fetchAiReview(id),
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

export function useSetRuleAdherence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ruleAdherence,
      ruleAdherenceNote,
    }: {
      id: string;
      ruleAdherence: "system" | "discretionary" | null;
      ruleAdherenceNote?: string;
    }) => setRuleAdherence(id, { ruleAdherence, ruleAdherenceNote }),
    onSuccess: (trade) => {
      qc.invalidateQueries({ queryKey: journalKeys.all });
      qc.setQueryData(journalKeys.detail(trade.id), trade);
    },
  });
}
