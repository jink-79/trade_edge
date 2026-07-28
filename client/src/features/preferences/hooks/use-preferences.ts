import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchPreferences, savePreferences } from "../api/preferences-api";
import type { TradingPreferences } from "../types/preferences.types";

export const preferenceKeys = {
  all: ["preferences"] as const,
};

export function usePreferences() {
  return useQuery<TradingPreferences>({
    queryKey: preferenceKeys.all,
    queryFn: fetchPreferences,
    staleTime: 1000 * 60 * 5,
  });
}

export function useSavePreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: savePreferences,
    onSuccess: (data) => qc.setQueryData(preferenceKeys.all, data),
  });
}
