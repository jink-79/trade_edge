import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, ChevronRight, Layers, Search, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Metric, NotAvailable, ReportShell, Section } from "../components/report-shell";
import { useBacktestReport } from "../hooks/use-backtest-report";
import { useReportSelection } from "../hooks/use-report-selection";
import { useReportSymbols } from "../hooks/use-report-symbols";
import { StockPerformanceSkeleton } from "../components/report-skeletons";
import { inr, num, pct } from "../types/report.types";
import type { GroupBreakdownRow, Verdict } from "../types/report.types";

const PAGE_SIZE = 100;

const verdictTone: Record<Verdict, string> = {
  KEEP: "bg-primary/12 text-primary ring-primary/25",
  REVIEW: "bg-amber-500/12 text-amber-600 dark:text-amber-400 ring-amber-500/25",
  ELIMINATE: "bg-destructive/12 text-destructive ring-destructive/25",
  "TOO FEW TRADES": "bg-muted text-muted-foreground ring-border",
};

function RollupTable({ rows, bucketLabel }: { rows: GroupBreakdownRow[]; bucketLabel: string }) {
  if (!rows.length) return <NotAvailable label={`No ${bucketLabel.toLowerCase()} data for this run`} />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-[0.16em] text-muted-foreground border-b border-border/60">
            <th className="py-3 pr-4 font-medium">{bucketLabel}</th>
            <th className="px-4 py-3 font-medium text-right">Trades</th>
            <th className="px-4 py-3 font-medium text-right">Share</th>
            <th className="px-4 py-3 font-medium text-right">Win rate</th>
            <th className="px-4 py-3 font-medium text-right">Net P&amp;L</th>
            <th className="px-4 py-3 font-medium text-right">PF</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.Group} className="border-b border-border/40 last:border-0 hover:bg-accent/30">
              <td className="py-3 pr-4">{r.Group}</td>
              <td className="px-4 py-3 text-right tabular-nums">{r.Trades ?? "—"}</td>
              <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                {r["% of Total Trades"] != null ? `${r["% of Total Trades"].toFixed(2)}%` : "—"}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {r["Win Rate %"] != null ? `${r["Win Rate %"].toFixed(2)}%` : "—"}
              </td>
              <td className={`px-4 py-3 text-right tabular-nums ${(r["Net P&L (Rs)"] ?? 0) >= 0 ? "text-primary" : "text-destructive"}`}>
                {inr(r["Net P&L (Rs)"])}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">{num(r["Profit Factor"])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StockPerformancePage() {
  const { versions, current, metrics, isLoading } = useBacktestReport();
  const { version, universe } = useReportSelection();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  // New search resets to the first page (otherwise you can land past the end).
  useEffect(() => setPage(1), [q, current?.version, current?.universe]);

  const { rows, total } = useReportSymbols(current, { q, page, pageSize: PAGE_SIZE });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Aggregate tiles come from the run's metrics (all symbols) — not the current
  // page, so they stay correct regardless of pagination.
  const openStock = (symbol: string) =>
    navigate(`/report/stocks/${encodeURIComponent(symbol)}?v=${version}&u=${universe}`);

  if (isLoading) {
    return <StockPerformanceSkeleton />;
  }

  return (
    <ReportShell title="Individual stock performance" desc="Symbol scorecard plus sector and market-cap rollups" versions={versions} current={current}>
      {!metrics ? (
        <NotAvailable label="No data for this strategy/version/universe yet" />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <Metric label="Symbols traded" value={String(metrics.symbolsTraded ?? total)} />
            <Metric label="Total trades" value={metrics.totalTrades != null ? String(metrics.totalTrades) : "—"} />
            <Metric label="Net P&L" value={inr(metrics.netProfit)} tone={(metrics.netProfit ?? 0) >= 0 ? "pos" : "neg"} />
            <Metric label="Win rate" value={pct(metrics.winRatePct, 1)} />
            <Metric label="Profit factor" value={num(metrics.profitFactor)} />
          </div>

          <Section
            title="Symbol scorecard"
            desc="Per-symbol edge, including sector and market cap where the run carries that metadata"
            icon={Table2}
            action={
              <div className="relative w-56">
                <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search symbol…" className="pl-9" />
              </div>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[1080px]">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-[0.16em] text-muted-foreground border-b border-border/60">
                    <th className="py-3 pr-4 font-medium">Symbol</th>
                    <th className="px-4 py-3 font-medium">Sector</th>
                    <th className="px-4 py-3 font-medium">Market cap</th>
                    <th className="px-4 py-3 font-medium text-right">Trades</th>
                    <th className="px-4 py-3 font-medium text-right">Wins</th>
                    <th className="px-4 py-3 font-medium text-right">Losses</th>
                    <th className="px-4 py-3 font-medium text-right">Win rate</th>
                    <th className="px-4 py-3 font-medium text-right">Net P&amp;L</th>
                    <th className="px-4 py-3 font-medium text-right">Charges</th>
                    <th className="px-4 py-3 font-medium text-right">PF</th>
                    <th className="px-4 py-3 font-medium text-right">Sharpe</th>
                    <th className="px-4 py-3 font-medium">Verdict</th>
                    <th className="px-2 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => (
                    <tr
                      key={s.Symbol}
                      onClick={() => openStock(s.Symbol)}
                      className="border-b border-border/40 last:border-0 hover:bg-accent/40 cursor-pointer"
                    >
                      <td className="py-3 pr-4 font-mono text-[13px] font-medium text-primary">{s.Symbol}</td>
                      <td className="px-4 py-3 text-xs">{s.Sector ?? <span className="text-muted-foreground/70 italic">Not available</span>}</td>
                      <td className="px-4 py-3 text-xs">{s["Market Cap"] ?? <span className="text-muted-foreground/70 italic">Not available</span>}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{s.Trades ?? "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-primary">{s.Wins ?? "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-destructive">{s.Losses ?? "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{s["Win Rate %"] != null ? `${s["Win Rate %"].toFixed(1)}%` : "—"}</td>
                      <td className={`px-4 py-3 text-right tabular-nums ${(s["Net P&L (Rs)"] ?? 0) >= 0 ? "text-primary" : "text-destructive"}`}>
                        {inr(s["Net P&L (Rs)"])}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{inr(s["Total Charges (Rs)"])}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{num(s["Profit Factor"])}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{num(s["Sharpe Ratio"])}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-md px-2 py-0.5 text-[11px] ring-1 ${verdictTone[s.Verdict]}`}>{s.Verdict}</span>
                      </td>
                      <td className="px-2 py-3 text-muted-foreground">
                        <ChevronRight className="size-4" />
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={13} className="py-12 text-center text-sm text-muted-foreground">
                        No symbols match that search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 text-sm">
                <span className="text-muted-foreground tabular-nums">
                  Page {page} of {totalPages} · {total} symbols
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Section>

          <div className="grid xl:grid-cols-2 gap-6">
            <Section title="Sector-wise rollup" desc="Schema §18 — net edge grouped by sector" icon={Building2}>
              <RollupTable rows={metrics.sectorBreakdown} bucketLabel="Sector" />
            </Section>
            <Section title="Market-cap rollup" desc="Schema §18 — net edge grouped by capitalisation band" icon={Layers}>
              <RollupTable rows={metrics.marketCapBreakdown} bucketLabel="Market cap" />
            </Section>
          </div>
        </>
      )}
    </ReportShell>
  );
}
