import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchFunds, addFund, deleteFund, fetchFundsStatement } from "../api/funds-api";
import type { FundsResponse, FundsStatementResponse } from "../types/funds.types";

export const fundKeys = {
  all: ["funds"] as const,
  list: () => ["funds", "list"] as const,
  statement: () => ["funds", "statement"] as const,
};

export function useFunds() {
  return useQuery<FundsResponse>({
    queryKey: fundKeys.list(),
    queryFn: fetchFunds,
    staleTime: 1000 * 60 * 5,
  });
}

export function useFundsStatement() {
  return useQuery<FundsStatementResponse>({
    queryKey: fundKeys.statement(),
    queryFn: fetchFundsStatement,
    staleTime: 1000 * 60 * 5,
  });
}

export function useAddFund() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addFund,
    onSuccess: () => qc.invalidateQueries({ queryKey: fundKeys.all }),
  });
}

export function useDeleteFund() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteFund,
    onSuccess: () => qc.invalidateQueries({ queryKey: fundKeys.all }),
  });
}
