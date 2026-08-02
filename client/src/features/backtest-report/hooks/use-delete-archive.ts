import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteArchiveReport } from "../api/backtest-archive-api";
import { STRATEGY } from "../types/report.types";

export interface DeleteArchiveInput {
  strategyName: string;
  version: string;
  universe: string;
}

/** Delete one archived version, then refresh the version list + strategy summary. */
export function useDeleteArchive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ strategyName, version, universe }: DeleteArchiveInput) =>
      deleteArchiveReport(strategyName, version, universe),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["backtest-archive", "versions", vars.strategyName] });
      qc.invalidateQueries({ queryKey: ["backtest-archive", "report", vars.strategyName] });
      qc.invalidateQueries({ queryKey: ["backtest-archive", "versions", STRATEGY] });
    },
  });
}
