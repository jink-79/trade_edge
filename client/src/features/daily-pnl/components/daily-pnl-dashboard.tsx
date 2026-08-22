import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLatestDailyPnl } from "../hooks/use-daily-pnl";
import { DailyPnlSnapshotView } from "./daily-pnl-snapshot-view";
import { DailyPnlHistory } from "./daily-pnl-history";
import { fmtDateTime } from "./daily-pnl-format";

export function DailyPnlDashboard() {
  const { data: latest, isLoading, error } = useLatestDailyPnl();
  const [view, setView] = useState<"today" | "history">("today");

  return (
    <div className="px-8 py-8 space-y-8 max-w-[1600px]">
      <div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <span className="size-1.5 rounded-full bg-primary animate-pulse" />
          Daily mark refresh
        </div>
        <h1 className="mt-2 text-3xl md:text-4xl font-semibold">Daily P&amp;L</h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
          Today's move on open positions, plus realized P&amp;L for trades closed today — from
          phalanx-live's daily OHLCV refresh.
          {latest ? ` Last refreshed ${fmtDateTime(latest.generatedAt)}.` : ""}
        </p>
      </div>

      <div className="flex gap-2">
        <Button size="sm" variant={view === "today" ? "default" : "outline"} onClick={() => setView("today")}>
          Today
        </Button>
        <Button size="sm" variant={view === "history" ? "default" : "outline"} onClick={() => setView("history")}>
          History
        </Button>
      </div>

      {view === "today" ? (
        isLoading ? (
          <p className="text-sm text-muted-foreground">Loading latest P&amp;L…</p>
        ) : error ? (
          <p className="text-sm text-destructive">Couldn't load daily P&amp;L.</p>
        ) : !latest ? (
          <p className="text-sm text-muted-foreground">
            No snapshot yet — this fills in once the daily mark-refresh cron runs, or after your
            next open position mark or exit.
          </p>
        ) : (
          <DailyPnlSnapshotView snapshot={latest} />
        )
      ) : (
        <DailyPnlHistory />
      )}
    </div>
  );
}
