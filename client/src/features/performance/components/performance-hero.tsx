import { LineChart, TriangleAlert } from "lucide-react";
import type { Performance } from "../types/performance.types";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export function PerformanceHero({ perf }: { perf: Performance }) {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <LineChart className="size-3.5 text-primary" />
          Real-time backtest · Signal Lab
        </div>
        <h1 className="mt-2 text-3xl md:text-4xl font-semibold">Performance</h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
          Every resolved Chartink signal as a 1%-risk paper trade — a backtest
          that grows each night. {perf.tradeCount} trades so far
          {perf.config?.startingCapital
            ? ` · ₹${(perf.config.startingCapital / 100000).toFixed(1)}L base`
            : ""}
          {perf.asOf ? ` · as of ${fmtDate(perf.asOf)}` : ""}.
        </p>
      </div>

      {perf.sampleWarning && (
        <div className="flex items-start gap-2.5 rounded-xl border border-[oklch(0.82_0.16_85/0.4)] bg-[oklch(0.82_0.16_85/0.08)] px-4 py-3">
          <TriangleAlert
            className="size-4 mt-0.5 shrink-0"
            style={{ color: "oklch(0.82 0.16 85)" }}
          />
          <p className="text-xs text-foreground/90">{perf.sampleWarning}</p>
        </div>
      )}
    </div>
  );
}
