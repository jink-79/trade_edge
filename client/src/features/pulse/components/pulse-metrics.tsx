import { useMemo, useState } from "react";
import { BarChart3, Gauge, Shield, Target, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { usePulsePerformance } from "../hooks/use-pulse";
import { PulseKpis } from "./pulse-kpis";
import { PulseEquityCard } from "./pulse-equity-card";
import { PulseVariants } from "./pulse-variants";
import { fmtPct, fmtNum } from "./pulse-format";
import { Button } from "@/components/ui/button";
import type { PulseMetrics } from "../types/pulse.types";

function Section({
  title,
  desc,
  icon: Icon,
  children,
}: {
  title: string;
  desc?: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur shadow-[var(--shadow-card)]">
      <div className="flex items-start gap-3 px-6 pt-5 pb-4 border-b border-border/60">
        <div className="size-9 rounded-xl grid place-items-center bg-primary/15 ring-1 ring-primary/30 shrink-0">
          <Icon className="size-4 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-[15px] font-semibold tracking-tight">{title}</h2>
          {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function Metric({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "pos" | "neg" }) {
  const color = tone === "pos" ? "text-primary" : tone === "neg" ? "text-destructive" : "text-foreground";
  return (
    <div className="rounded-xl border border-border/60 bg-background/40 px-4 py-3">
      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div className={`mt-1 font-display text-lg font-semibold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}

function groups(m: PulseMetrics) {
  const sign = (n: number | null) => (n == null ? "default" : n >= 0 ? "pos" : "neg") as "default" | "pos" | "neg";
  return {
    returns: [
      { l: "Total Return", v: fmtPct(m.returnPct), t: sign(m.returnPct) },
      { l: "CAGR", v: fmtPct(m.cagrPct), t: sign(m.cagrPct) },
      { l: "Nifty CAGR", v: fmtPct(m.niftyCagrPct) },
      { l: "Alpha vs Nifty", v: m.alphaPct != null ? `${m.alphaPct.toFixed(1)}pp` : "—", t: sign(m.alphaPct) },
    ],
    risk: [
      { l: "Max Drawdown", v: fmtPct(m.maxDrawdownPct), t: "neg" as const },
      { l: "Avg Drawdown", v: fmtPct(m.avgDrawdownPct), t: "neg" as const },
      { l: "Max DD Length", v: m.maxDrawdownWeeks != null ? `${m.maxDrawdownWeeks}w` : "—" },
      { l: "Volatility", v: fmtPct(m.volatilityPct) },
    ],
    perf: [
      { l: "Sharpe", v: fmtNum(m.sharpe) },
      { l: "Sortino", v: fmtNum(m.sortino) },
      { l: "Calmar", v: fmtNum(m.calmar) },
      { l: "Profit Factor", v: fmtNum(m.profitFactor) },
    ],
    trades: [
      { l: "Trades", v: String(m.trades ?? "—") },
      { l: "Win Rate", v: fmtPct(m.winRatePct), t: (m.winRatePct ?? 0) >= 50 ? ("pos" as const) : ("neg" as const) },
      { l: "Best Trade", v: fmtPct(m.bestTradePct), t: "pos" as const },
      { l: "Worst Trade", v: fmtPct(m.worstTradePct), t: "neg" as const },
      { l: "Avg Win", v: fmtPct(m.avgWinPct), t: "pos" as const },
      { l: "Avg Loss", v: fmtPct(m.avgLossPct), t: "neg" as const },
      { l: "Expectancy", v: fmtPct(m.expectancyPct), t: sign(m.expectancyPct) },
    ],
  };
}

export function PulseMetricsView() {
  const { data: perf = [], isLoading } = usePulsePerformance();
  const [variant, setVariant] = useState<string | null>(null);
  const selected = useMemo(() => {
    if (!perf.length) return null;
    const pick = variant ?? perf.find((v) => v.variant.includes("fno"))?.variant ?? perf[0].variant;
    return perf.find((v) => v.variant === pick) ?? perf[0];
  }, [perf, variant]);

  const monthly = useMemo(
    () => (selected?.monthlyReturns ?? []).map((r) => ({ m: r.month?.slice(2), r: r.ret ?? 0 })),
    [selected],
  );

  if (isLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">Loading metrics…</div>;
  }
  if (!selected || !selected.metrics) {
    return (
      <div className="px-8 py-8 space-y-4 max-w-[1400px]">
        <h1 className="text-3xl font-semibold">Pulse Breaker v10</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          No backtest yet. From <code className="text-foreground">pulse_trader</code> run{" "}
          <code className="text-foreground">python -m courier.publish all</code> to populate metrics.
        </p>
      </div>
    );
  }

  const g = groups(selected.metrics);

  return (
    <div className="min-w-0">
      <header className="h-16 border-b border-border/60 bg-background/70 backdrop-blur-xl sticky top-0 z-10 flex items-center justify-between px-8">
        <div>
          <h1 className="font-display text-lg font-semibold tracking-tight">Pulse Breaker — strategy metrics</h1>
          <p className="text-xs text-muted-foreground">
            Weekly breakout · RS-55 · ATR 1×/2× bracket · 6%-equity / 12-cap
          </p>
        </div>
        {perf.length > 1 && (
          <div className="hidden sm:flex gap-1.5">
            {perf.map((v) => (
              <Button
                key={v.variant}
                size="sm"
                variant={selected.variant === v.variant ? "default" : "outline"}
                onClick={() => setVariant(v.variant)}
              >
                {v.label ?? v.variant}
              </Button>
            ))}
          </div>
        )}
      </header>

      <div className="p-8 space-y-6 max-w-[1400px]">
        <PulseKpis m={selected.metrics} />

        <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-6">
          <PulseEquityCard
            equity={selected.equityCurve}
            benchmark={selected.benchmarkCurve}
            label={selected.label ?? selected.variant}
            warning={selected.sampleWarning}
          />
          <Section title="Monthly returns" desc="% per month" icon={BarChart3}>
            <div className="h-[260px]">
              {monthly.length === 0 ? (
                <div className="h-full grid place-items-center text-sm text-muted-foreground">No monthly data.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="m" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" interval={5} />
                    <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" width={36} />
                    <Tooltip cursor={{ fill: "var(--accent)", opacity: 0.3 }} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                    <Bar dataKey="r" radius={[4, 4, 0, 0]}>
                      {monthly.map((d) => (
                        <Cell key={d.m} fill={d.r >= 0 ? "var(--primary)" : "var(--destructive)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Section>
        </div>

        <Section title="Returns" desc="Headline performance vs Nifty 50" icon={TrendingUp}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {g.returns.map((s) => <Metric key={s.l} label={s.l} value={s.v} tone={s.t} />)}
          </div>
        </Section>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Section title="Risk" icon={Shield}>
            <div className="grid grid-cols-2 gap-3">{g.risk.map((s) => <Metric key={s.l} label={s.l} value={s.v} tone={s.t} />)}</div>
          </Section>
          <Section title="Performance" icon={Gauge}>
            <div className="grid grid-cols-2 gap-3">{g.perf.map((s) => <Metric key={s.l} label={s.l} value={s.v} />)}</div>
          </Section>
        </div>

        <Section title="Trade stats" desc="Across all closed trades" icon={Target}>
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
            {g.trades.map((s) => <Metric key={s.l} label={s.l} value={s.v} tone={(s as any).t} />)}
          </div>
        </Section>

        <PulseVariants variants={perf} selected={selected.variant} onSelect={setVariant} />
      </div>
    </div>
  );
}
