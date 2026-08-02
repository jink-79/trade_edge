import { useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  Clock,
  Gauge,
  Layers,
  Repeat,
  Shield,
  Target,
  TrendingUp,
} from "lucide-react";
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
import { fmtPct, fmtNum, fmtMoney } from "./pulse-format";
import { Button } from "@/components/ui/button";
import type { GroupBreakdownRow, PulseMetrics } from "../types/pulse.types";

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

// `??` fallbacks read the courier's CURRENT field name first, then the
// BACKTEST_REPORT_SCHEMA.md name — works today and keeps working once the
// courier is updated to emit the schema-doc names (see pulse.types.ts).
function groups(m: PulseMetrics) {
  const sign = (n: number | null | undefined) =>
    (n == null ? "default" : n >= 0 ? "pos" : "neg") as "default" | "pos" | "neg";
  const weeks = (n: number | null | undefined) => (n != null ? `${fmtNum(n, 1)}w` : "—");
  const totalReturn = m.totalReturnPct ?? m.returnPct;
  const totalTrades = m.totalTrades ?? m.trades;

  return {
    returns: [
      { l: "Total Return", v: fmtPct(totalReturn), t: sign(totalReturn) },
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
      { l: "Trades", v: String(totalTrades ?? "—") },
      { l: "Win Rate", v: fmtPct(m.winRatePct), t: (m.winRatePct ?? 0) >= 50 ? ("pos" as const) : ("neg" as const) },
      { l: "Best Trade", v: fmtPct(m.bestTradePct), t: "pos" as const },
      { l: "Worst Trade", v: fmtPct(m.worstTradePct), t: "neg" as const },
      { l: "Avg Win", v: fmtPct(m.avgWinPct), t: "pos" as const },
      { l: "Avg Loss", v: fmtPct(m.avgLossPct), t: "neg" as const },
      { l: "Expectancy", v: fmtPct(m.expectancyPct), t: sign(m.expectancyPct) },
    ],
    streaks: [
      { l: "Max Win Streak", v: String(m.maxWinStreak ?? "—") },
      { l: "Max Loss Streak", v: String(m.maxLossStreak ?? "—") },
      { l: "Avg Win Streak", v: fmtNum(m.avgWinStreak, 1) },
      { l: "Avg Loss Streak", v: fmtNum(m.avgLossStreak, 1) },
    ],
    holding: [
      { l: "Avg Hold", v: weeks(m.avgHoldWeeks) },
      { l: "Median Hold", v: weeks(m.medianHoldWeeks) },
      { l: "Avg Win Hold", v: weeks(m.avgWinningHoldWeeks) },
      { l: "Avg Loss Hold", v: weeks(m.avgLosingHoldWeeks) },
    ],
    execution: [
      { l: "Avg Position Size", v: fmtMoney(m.avgPositionSizeRs) },
      { l: "Capital Utilization", v: fmtPct(m.avgCapitalUtilizationPct) },
      { l: "Cash Idle", v: fmtPct(m.cashIdlePct) },
      { l: "Max Concurrent", v: String(m.maxConcurrentPositions ?? "—") },
      { l: "Time in Market", v: fmtPct(m.timeInMarketPct) },
      { l: "Trades / yr", v: fmtNum(m.tradesPerYear, 1) },
    ],
    quality: [
      { l: "SQN", v: fmtNum(m.sqn) },
      { l: "Kelly %", v: fmtPct(m.kellyPct) },
      { l: "Ulcer Index", v: fmtNum(m.ulcerIndex) },
      { l: "Equity R²", v: fmtNum(m.equityCurveR2) },
    ],
  };
}

function BreakdownTable({ title, rows }: { title: string; rows: GroupBreakdownRow[] }) {
  if (!rows.length) {
    return <p className="text-sm text-muted-foreground">No {title.toLowerCase()} data yet.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-[0.16em] text-muted-foreground border-b border-border/60">
            <th className="py-2 pr-4 font-medium">Group</th>
            <th className="py-2 px-4 font-medium text-right">Trades</th>
            <th className="py-2 px-4 font-medium text-right">Win %</th>
            <th className="py-2 px-4 font-medium text-right">Net P&amp;L</th>
            <th className="py-2 pl-4 font-medium text-right">PF</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.Group} className="border-b border-border/40 last:border-0">
              <td className="py-2 pr-4 font-medium">{r.Group}</td>
              <td className="py-2 px-4 text-right tabular-nums">{r.Trades ?? "—"}</td>
              <td className="py-2 px-4 text-right tabular-nums">{fmtPct(r["Win Rate %"])}</td>
              <td
                className={`py-2 px-4 text-right tabular-nums ${
                  (r["Net P&L (Rs)"] ?? 0) >= 0 ? "text-primary" : "text-destructive"
                }`}
              >
                {fmtMoney(r["Net P&L (Rs)"])}
              </td>
              <td className="py-2 pl-4 text-right tabular-nums">{fmtNum(r["Profit Factor"])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
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
            {g.trades.map((s) => <Metric key={s.l} label={s.l} value={s.v} tone={(s as { t?: "default" | "pos" | "neg" }).t} />)}
          </div>
        </Section>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Section title="Streaks" icon={Repeat}>
            <div className="grid grid-cols-2 gap-3">{g.streaks.map((s) => <Metric key={s.l} label={s.l} value={s.v} />)}</div>
          </Section>
          <Section title="Holding period" icon={Clock}>
            <div className="grid grid-cols-2 gap-3">{g.holding.map((s) => <Metric key={s.l} label={s.l} value={s.v} />)}</div>
          </Section>
        </div>

        <Section title="Execution & exposure" desc="Position sizing, capital deployment, time in market" icon={Layers}>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {g.execution.map((s) => <Metric key={s.l} label={s.l} value={s.v} />)}
          </div>
        </Section>

        <Section title="Trade quality" desc="System Quality Number, Kelly sizing, curve smoothness" icon={Activity}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {g.quality.map((s) => <Metric key={s.l} label={s.l} value={s.v} />)}
          </div>
        </Section>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Section title="Sector breakdown" desc="tracked-universe runs only" icon={BarChart3}>
            <BreakdownTable title="Sector breakdown" rows={selected.metrics.sectorBreakdown ?? []} />
          </Section>
          <Section title="Market cap breakdown" desc="tracked-universe runs only" icon={BarChart3}>
            <BreakdownTable title="Market cap breakdown" rows={selected.metrics.marketCapBreakdown ?? []} />
          </Section>
        </div>

        <PulseVariants variants={perf} selected={selected.variant} onSelect={setVariant} />
      </div>
    </div>
  );
}
