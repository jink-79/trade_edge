import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { usePulseScan, usePulsePerformance } from "../hooks/use-pulse";
import { PulseKpis } from "./pulse-kpis";
import { PulseEquityCard } from "./pulse-equity-card";
import { PulseVariants } from "./pulse-variants";
import { PulseSignalsTable } from "./pulse-signals-table";

/**
 * The full Pulse Breaker v10 view: KPIs, equity curve vs Nifty, variant
 * comparison, and this week's ranked signals. Rendered by the Signals and
 * Signal Results pages when Pulse is the active strategy.
 */
export function PulseDashboard() {
  const { data: perf, isLoading: perfLoading } = usePulsePerformance();
  const { data: run, isLoading: runLoading } = usePulseScan();
  const [variant, setVariant] = useState<string | null>(null);

  const variants = perf ?? [];
  const selected = useMemo(() => {
    if (!variants.length) return null;
    const pick =
      variant ??
      variants.find((v) => v.variant.includes("fno"))?.variant ??
      variants[0].variant;
    return variants.find((v) => v.variant === pick) ?? variants[0];
  }, [variants, variant]);

  if (perfLoading || runLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        Loading Pulse Breaker…
      </div>
    );
  }

  const hasData = variants.length > 0 || run;
  if (!hasData) {
    return (
      <div className="px-8 py-8 space-y-6 max-w-[1600px]">
        <h1 className="text-3xl md:text-4xl font-semibold">Pulse Breaker v10</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
          No data yet. From the{" "}
          <code className="text-foreground">pulse_trader</code> project, run{" "}
          <code className="text-foreground">python -m courier.publish all</code>{" "}
          to post this week's scan and the backtest snapshot here.
        </p>
      </div>
    );
  }

  return (
    <div className="px-8 py-8 space-y-8 max-w-[1600px]">
      <div>
        <h1
          className="text-3xl md:text-4xl font-semibold"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Pulse Breaker v10
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
          Weekly breakout + RS-55 + volume + rising-SMA30, ATR 1×/2× bracket,
          6%-equity · 12-cap. Visual validation before it touches a broker.
          {run ? ` Scan as of ${run.asOf?.slice(0, 10)}.` : ""}
        </p>
      </div>

      {variants.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {variants.map((v) => (
            <Button
              key={v.variant}
              size="sm"
              variant={selected?.variant === v.variant ? "default" : "outline"}
              onClick={() => setVariant(v.variant)}
            >
              {v.label ?? v.variant}
            </Button>
          ))}
        </div>
      )}

      {selected?.metrics && <PulseKpis m={selected.metrics} />}

      {selected && (
        <PulseEquityCard
          equity={selected.equityCurve}
          benchmark={selected.benchmarkCurve}
          label={selected.label ?? selected.variant}
          warning={selected.sampleWarning}
        />
      )}

      {variants.length > 0 && (
        <PulseVariants
          variants={variants}
          selected={selected?.variant}
          onSelect={setVariant}
        />
      )}

      {run && <PulseSignalsTable run={run} />}
    </div>
  );
}
