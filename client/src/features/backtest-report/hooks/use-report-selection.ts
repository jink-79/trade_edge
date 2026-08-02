import { useSearchParams } from "react-router-dom";
import type { ReportUniverse } from "../types/report.types";

export interface ReportSelection {
  version: string;
  universe: ReportUniverse;
}

/** Reads ?v=&u= from the URL. Empty version means "use the latest available".
 * Universe is always "tracked" now (the fno variant is retired). */
export function useReportSelection(): ReportSelection {
  const [params] = useSearchParams();
  return {
    version: params.get("v") ?? "",
    universe: "tracked",
  };
}
