import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { errorMessage } from "@/features/accounts/hooks/use-accounts";
import * as api from "../api/possessions-api";
import type { PossessionPayload } from "../types/possessions.types";

const KEY = ["possessions"] as const;

export function usePossessions() {
  return useQuery({ queryKey: KEY, queryFn: api.fetchPossessions });
}

export function useSavePossession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: PossessionPayload & { id?: string }) =>
      id ? api.updatePossession(id, payload) : api.createPossession(payload),
    onSuccess: (p, vars) => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success(vars.id ? "Saved" : `${p.name} added`);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
}

export function useDeletePossession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deletePossession(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Removed");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
}
