import { DailyPnlKpis } from "./daily-pnl-kpis";
import { DailyPnlOpenTable, DailyPnlClosedTable } from "./daily-pnl-tables";
import type { DailyPnlSnapshot } from "../types/daily-pnl.types";

export function DailyPnlSnapshotView({ snapshot }: { snapshot: DailyPnlSnapshot }) {
  return (
    <div className="space-y-6">
      <DailyPnlKpis snapshot={snapshot} />
      <DailyPnlOpenTable snapshot={snapshot} />
      <DailyPnlClosedTable snapshot={snapshot} />
    </div>
  );
}
