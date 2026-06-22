import { AlertTriangle, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// hooks
import { enrichPosition, deriveSummary } from "../hooks/use-positions";

// components
import { PositionsStatsBar } from "../components/positions-stats-bar";
import { PositionsTable } from "../components/positions-table";

// mock (flip USE_MOCK = false when API is live)
import { MOCK_POSITIONS } from "../api/positions-mock";
import { fmtINR } from "@/lib/positions-utils";

const USE_MOCK = true;

export function PositionsPage() {
  // swap for: const { data, isLoading } = usePositions() when live
  const raw = USE_MOCK ? MOCK_POSITIONS : [];
  const enriched = raw.map(enrichPosition);
  const summary = deriveSummary(enriched);

  return (
    <div className="px-8 py-8 space-y-8 max-w-[1600px]">
      {/* ── HERO ── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            Live · {enriched.length} open positions
          </div>
          <h1 className="mt-2 text-3xl md:text-4xl font-semibold">
            Open Positions
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Deployed{" "}
            <span className="text-foreground tabular">
              {fmtINR(summary.totalInvested)}
            </span>{" "}
            across {enriched.length} stocks ·{" "}
            <span
              className={
                summary.totalPnl >= 0
                  ? "text-primary tabular"
                  : "text-destructive tabular"
              }
            >
              {summary.totalPnl >= 0 ? "+" : ""}
              {summary.totalPnlPct.toFixed(2)}% unrealised
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-border/70"
          >
            <RefreshCw className="size-3.5" /> Refresh
          </Button>
          {summary.signalCount > 0 && (
            <Badge className="bg-destructive/15 text-destructive border border-destructive/30 hover:bg-destructive/15">
              <AlertTriangle className="size-3 mr-1" />
              {summary.signalCount} Exit Signal
              {summary.signalCount > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </div>

      {/* ── KPI CARDS ── */}
      <PositionsStatsBar summary={summary} positionCount={enriched.length} />

      {/* ── TABLE ── */}
      <PositionsTable positions={enriched} />
    </div>
  );
}
