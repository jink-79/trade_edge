import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import * as api from "../api/accounts-api";
import type {
  AccountDetail,
  CreateAccountPayload,
  UpdateAccountPayload,
  UpsertSnapshotPayload,
} from "../types/accounts.types";

const KEYS = {
  all: ["accounts"] as const,
  one: (id: string) => ["accounts", id] as const,
};

export function errorMessage(err: unknown, fallback = "Something went wrong. Try again."): string {
  return (isAxiosError(err) ? err.response?.data?.message : undefined) ?? fallback;
}

export function useAccounts() {
  return useQuery({ queryKey: KEYS.all, queryFn: api.fetchAccounts });
}

export function useAccount(id: string) {
  return useQuery({ queryKey: KEYS.one(id), queryFn: () => api.fetchAccount(id) });
}

/** After any write: store the fresh detail and refresh the list. */
function useSync() {
  const qc = useQueryClient();
  return (detail?: AccountDetail) => {
    if (detail) qc.setQueryData(KEYS.one(detail.id), detail);
    return qc.invalidateQueries({ queryKey: KEYS.all, exact: true });
  };
}

export function useCreateAccount() {
  const sync = useSync();
  return useMutation({
    mutationFn: (p: CreateAccountPayload) => api.createAccount(p),
    onSuccess: (d) => {
      sync(d);
      toast.success(`${d.name} added`);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
}

export function useUpdateAccount(id: string) {
  const sync = useSync();
  return useMutation({
    mutationFn: (p: UpdateAccountPayload) => api.updateAccount(id, p),
    onSuccess: (d) => sync(d),
    onError: (e) => toast.error(errorMessage(e)),
  });
}

export function useDeleteAccount(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.deleteAccount(id),
    onSuccess: () => {
      qc.removeQueries({ queryKey: KEYS.one(id) });
      qc.invalidateQueries({ queryKey: KEYS.all, exact: true });
      toast.success("Account deleted");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
}

export function useUpsertSnapshot(id: string) {
  const sync = useSync();
  return useMutation({
    mutationFn: ({ month, ...p }: UpsertSnapshotPayload & { month: string }) =>
      api.upsertSnapshot(id, month, p),
    onSuccess: (d) => {
      sync(d);
      toast.success("Saved");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
}

export function useDeleteSnapshot(id: string) {
  const sync = useSync();
  return useMutation({
    mutationFn: (month: string) => api.deleteSnapshot(id, month),
    onSuccess: (d) => sync(d),
    onError: (e) => toast.error(errorMessage(e)),
  });
}
