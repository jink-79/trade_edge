import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadArchive } from "../api/backtest-archive-api";

export function useUploadArchive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: uploadArchive,
    onSuccess: (report) => {
      qc.invalidateQueries({ queryKey: ["backtest-archive", "versions", report.strategyName] });
      qc.invalidateQueries({ queryKey: ["backtest-archive", "report", report.strategyName, report.version, report.universe] });
    },
  });
}
