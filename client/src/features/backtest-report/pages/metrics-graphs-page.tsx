import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { Activity, CircleDot, Gauge, Percent, TrendingDown, TrendingUp } from "lucide-react";
import { Metric, NotAvailable, ReportShell, Section } from "../components/report-shell";
import { useBacktestReport } from "../hooks/use-backtest-report";
import { useReportSymbols } from "../hooks/use-report-symbols";
import { useReportTradeLog } from "../hooks/use-report-trade-log";
import { MetricsGraphsSkeleton } from "../components/report-skeletons";
import { buildMetricGroups } from "../utils/metric-groups";

const axis = { stroke: "var(--muted-foreground)", fontSize: 10 } as const;

/** Count values into [edge, nextEdge) buckets; out-of-range values clamp to the ends. */
function bucketize(values: number[], edges: number[], fmt: (lo: number, hi: number) => string) {
  const buckets = edges.slice(0, -1).map((lo, i) => ({ label: fmt(lo, edges[i + 1]), lo, count: 0 }));
  for (const raw of values) {
    const v = Math.min(Math.max(raw, edges[0]), edges[edges.length - 1] - 1e-9);
    for (let i = 0; i < buckets.length; i++) {
      if (v >= edges[i] && v < edges[i + 1]) {
        buckets[i].count++;
        break;
      }
    }
  }
  return buckets;
}

function ChartFrame({ children, height = 260 }: { children: React.ReactNode; height?: number }) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        {children as never}
      </ResponsiveContainer>
    </div>
  );
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function heatTone(r: number | null) {
  if (r == null) return "bg-background/30 text-muted-foreground/50 border-dashed";
  return r >= 0 ? "text-primary border-primary/25 bg-primary/10" : "text-destructive border-destructive/25 bg-destructive/10";
}

export function MetricsGraphsPage() {
  const { versions, current, metrics, isLoading } = useBacktestReport();
  const { rows: symbols } = useReportSymbols(current, { pageSize: 500 });
  const { rows: allTrades } = useReportTradeLog(current, "", { pageSize: 5000 });

  const groups = useMemo(() => (metrics ? buildMetricGroups(metrics) : []), [metrics]);

  // Rolling 52-week Sharpe from the stored weekly equity curve.
  const rollingSharpe = useMemo(() => {
    const eq = (metrics?.equityCurve ?? []).filter((p) => p.equity != null) as { date: string; equity: number }[];
    if (eq.length < 60) return [];
    const rets: number[] = [];
    for (let i = 1; i < eq.length; i++) rets.push(eq[i].equity / eq[i - 1].equity - 1);
    const W = 52;
    const out: { t: string; sharpe: number }[] = [];
    for (let i = W; i <= rets.length; i++) {
      const win = rets.slice(i - W, i);
      const mean = win.reduce((a, b) => a + b, 0) / W;
      const sd = Math.sqrt(win.reduce((a, b) => a + (b - mean) ** 2, 0) / W);
      if (sd > 0) out.push({ t: eq[i].date.slice(0, 7), sharpe: +((mean / sd) * Math.sqrt(52)).toFixed(2) });
    }
    return out;
  }, [metrics]);

  const concurrency = useMemo(
    () => (metrics?.concurrency ?? [])
      .filter((p) => p.open != null)
      .map((p) => ({ t: p.date.slice(5), open: p.open as number })),
    [metrics],
  );

  const tradeHist = useMemo(() => {
    const vals = allTrades.map((t) => t["Return (%)"]).filter((v): v is number => v != null);
    if (!vals.length) return [];
    return bucketize(vals, [-50, -30, -20, -10, 0, 10, 20, 30, 50, 100, 200], (lo) => `${lo > 0 ? "+" : ""}${lo}%`)
      .map((b) => ({ ...b, fill: b.lo < 0 ? "var(--destructive)" : "var(--primary)" }));
  }, [allTrades]);

  const holdHist = useMemo(() => {
    const vals = allTrades.map((t) => t["Duration (weeks)"]).filter((v): v is number => v != null);
    if (!vals.length) return [];
    return bucketize(vals, [0, 2, 3, 5, 8, 13, 26, 52, 104], (lo, hi) => `${lo}-${hi}w`);
  }, [allTrades]);

  const equity = useMemo(() => {
    const eq = metrics?.equityCurve ?? [];
    const bench = new Map((metrics?.benchmarkCurve ?? []).map((b) => [b.date, b.value]));
    return eq
      .filter((p) => p.equity != null)
      .map((p) => ({ t: p.date.slice(5), strategy: p.equity, nifty: bench.get(p.date) ?? null }));
  }, [metrics]);

  const monthlyByYear = useMemo(() => {
    const cells = new Map<string, number | null>();
    for (const m of metrics?.monthlyReturns ?? []) {
      if (!m.month) continue;
      cells.set(m.month, m.ret ?? null);
    }
    const years = [...new Set([...cells.keys()].map((k) => k.slice(0, 4)))].sort();
    return { cells, years };
  }, [metrics]);

  const yearly = useMemo(() => {
    return (metrics?.yearlyReturns ?? [])
      .filter((y): y is { year: number; returnPct: number | null } => y.year != null)
      .map((y) => ({ year: y.year, strategy: y.returnPct ?? 0 }));
  }, [metrics]);

  if (isLoading) {
    return <MetricsGraphsSkeleton />;
  }

  return (
    <ReportShell
      title="Metrics & graphs"
      desc="Full metric book and every diagnostic chart for the selected strategy version"
      versions={versions}
      current={current}
    >
      {!metrics ? (
        <NotAvailable
          label="No data for this strategy/version/universe yet"
          hint="Live variants populate via the courier; archived versions via an upload."
        />
      ) : (
        <>
          {groups.map((g) => (
            <Section key={g.title} title={g.title} desc={g.desc} icon={Gauge}>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                {g.rows.map((row) => (
                  <Metric key={row.label} label={row.label} value={row.value} tone={row.tone} hint={row.hint} title={row.title} />
                ))}
              </div>
            </Section>
          ))}

          <Section title="Equity curve vs Nifty 50" desc="Strategy equity vs the benchmark, same period" icon={TrendingUp}>
            {equity.length < 2 ? (
              <NotAvailable label="No equity curve for this source yet" hint="Archived versions don't carry a stored equity curve today." />
            ) : (
              <ChartFrame height={300}>
                <AreaChart data={equity}>
                  <defs>
                    <linearGradient id="rEq" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="t" {...axis} interval={25} />
                  <YAxis {...axis} />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                  <Area type="monotone" dataKey="strategy" stroke="var(--primary)" fill="url(#rEq)" strokeWidth={2} name="Strategy" connectNulls />
                  <Area type="monotone" dataKey="nifty" stroke="var(--muted-foreground)" fill="transparent" strokeWidth={1.5} strokeDasharray="4 4" name="Nifty 50" connectNulls />
                </AreaChart>
              </ChartFrame>
            )}
          </Section>

          <div className="grid xl:grid-cols-2 gap-6">
            <Section title="Rolling 52-week Sharpe" desc="Regime-dependence of risk-adjusted return" icon={Activity}>
              {rollingSharpe.length < 2 ? (
                <NotAvailable label="Not available" hint="Needs a stored weekly equity curve — re-upload with the latest export." />
              ) : (
                <ChartFrame height={240}>
                  <AreaChart data={rollingSharpe}>
                    <defs>
                      <linearGradient id="rSharpe" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="t" {...axis} interval={25} />
                    <YAxis {...axis} />
                    <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                    <Area type="monotone" dataKey="sharpe" stroke="var(--primary)" fill="url(#rSharpe)" strokeWidth={2} name="Sharpe (52w)" />
                  </AreaChart>
                </ChartFrame>
              )}
            </Section>
            <Section title="Concurrency" desc="Open positions each week vs the 12-slot cap" icon={TrendingDown}>
              {concurrency.length < 2 ? (
                <NotAvailable label="Not available" hint="Needs the stored weekly position counts — re-upload with the latest export." />
              ) : (
                <ChartFrame height={240}>
                  <AreaChart data={concurrency}>
                    <defs>
                      <linearGradient id="rConc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="t" {...axis} interval={25} />
                    <YAxis {...axis} domain={[0, 12]} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                    <Area type="stepAfter" dataKey="open" stroke="var(--primary)" fill="url(#rConc)" strokeWidth={1.5} name="Open positions" />
                  </AreaChart>
                </ChartFrame>
              )}
            </Section>
          </div>

          <Section title="Monthly returns heatmap" desc="Month-by-month percentage return" icon={Percent}>
            {monthlyByYear.years.length === 0 ? (
              <NotAvailable label="No monthly data for this source yet" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[760px]">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      <th className="py-2 pr-4 text-left font-medium">Year</th>
                      {MONTHS.map((m) => (
                        <th key={m} className="px-1 py-2 font-medium">{m}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyByYear.years.map((year) => (
                      <tr key={year}>
                        <td className="py-1 pr-4 font-mono text-[13px] text-muted-foreground">{year}</td>
                        {MONTHS.map((_, mi) => {
                          const r = monthlyByYear.cells.get(`${year}-${String(mi + 1).padStart(2, "0")}`) ?? null;
                          return (
                            <td key={mi} className="px-1 py-1">
                              <div
                                title={r == null ? "Not available" : `${year} ${MONTHS[mi]}: ${r}%`}
                                className={`h-9 rounded-lg border grid place-items-center text-[11px] tabular-nums ${heatTone(r)}`}
                              >
                                {r == null ? "—" : r.toFixed(1)}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          <Section title="Yearly returns" desc="Strategy return by calendar year" icon={TrendingUp}>
            {yearly.length === 0 ? (
              <NotAvailable label="No yearly return data for this source yet" />
            ) : (
              <ChartFrame>
                <BarChart data={yearly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="year" {...axis} />
                  <YAxis {...axis} />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="strategy" name="Strategy %" radius={[4, 4, 0, 0]}>
                    {yearly.map((y) => (
                      <Cell key={y.year} fill={y.strategy >= 0 ? "var(--primary)" : "var(--destructive)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartFrame>
            )}
          </Section>

          <div className="grid xl:grid-cols-2 gap-6">
            <Section title="Trade return distribution" desc="Every trade's return %, bucketed" icon={Activity}>
              {tradeHist.length === 0 ? (
                <NotAvailable label="Not available" hint="Needs the per-trade log — available on uploaded archive versions." />
              ) : (
                <ChartFrame height={240}>
                  <BarChart data={tradeHist}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="label" {...axis} interval={0} angle={-30} textAnchor="end" height={50} />
                    <YAxis {...axis} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                    <Bar dataKey="count" name="Trades" radius={[4, 4, 0, 0]}>
                      {tradeHist.map((b) => (
                        <Cell key={b.label} fill={b.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartFrame>
              )}
            </Section>
            <Section title="Holding period distribution" desc="Weeks held, bucketed" icon={Activity}>
              {holdHist.length === 0 ? (
                <NotAvailable label="Not available" hint="Needs the per-trade log — available on uploaded archive versions." />
              ) : (
                <ChartFrame height={240}>
                  <BarChart data={holdHist}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="label" {...axis} interval={0} angle={-30} textAnchor="end" height={50} />
                    <YAxis {...axis} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                    <Bar dataKey="count" name="Trades" radius={[4, 4, 0, 0]} fill="var(--primary)" />
                  </BarChart>
                </ChartFrame>
              )}
            </Section>
          </div>

          <Section
            title="Symbol scorecard bubble chart"
            desc="Win rate × trades, bubble size = net P&L, colour = verdict"
            icon={CircleDot}
          >
            {symbols.length === 0 ? (
              <NotAvailable label="No per-symbol data in this run" />
            ) : (
              <>
                <ChartFrame height={320}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="Trades" name="Trades" {...axis} type="number" />
                    <YAxis dataKey="Win Rate %" name="Win rate %" {...axis} type="number" />
                    <ZAxis dataKey="bubble" range={[60, 700]} />
                    <Tooltip
                      cursor={{ strokeDasharray: "3 3" }}
                      contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
                    />
                    <Scatter
                      name="Symbols"
                      data={symbols.map((s) => ({
                        Trades: s.Trades ?? 0,
                        "Win Rate %": s["Win Rate %"] ?? 0,
                        bubble: Math.abs(s["Net P&L (Rs)"] ?? 0) + 2000,
                        verdict: s.Verdict,
                      }))}
                    >
                      {symbols.map((s) => (
                        <Cell
                          key={s.Symbol}
                          fill={
                            s.Verdict === "KEEP"
                              ? "var(--primary)"
                              : s.Verdict === "ELIMINATE"
                                ? "var(--destructive)"
                                : "var(--muted-foreground)"
                          }
                          fillOpacity={0.6}
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ChartFrame>
                <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-primary" /> Keep</span>
                  <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-muted-foreground" /> Review / too few</span>
                  <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-destructive" /> Eliminate</span>
                </div>
              </>
            )}
          </Section>
        </>
      )}
    </ReportShell>
  );
}
