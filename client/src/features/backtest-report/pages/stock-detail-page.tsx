import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Receipt, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Metric, NotAvailable, Section } from "../components/report-shell";
import { useBacktestReport } from "../hooks/use-backtest-report";
import { useReportSelection } from "../hooks/use-report-selection";
import { useReportSymbols } from "../hooks/use-report-symbols";
import { useReportTradeLog } from "../hooks/use-report-trade-log";
import { StockDetailSkeleton } from "../components/report-skeletons";
import { STRATEGY, inr, num, pct, type Verdict } from "../types/report.types";

const verdictTone: Record<Verdict, string> = {
  KEEP: "bg-primary/12 text-primary ring-primary/25",
  REVIEW: "bg-amber-500/12 text-amber-600 dark:text-amber-400 ring-amber-500/25",
  ELIMINATE: "bg-destructive/12 text-destructive ring-destructive/25",
  "TOO FEW TRADES": "bg-muted text-muted-foreground ring-border",
};

const PAGE_SIZE = 100;

export function StockDetailPage() {
  const { symbol = "" } = useParams();
  const { version, universe } = useReportSelection();
  const { current, isLoading } = useBacktestReport();
  const backHref = `/report/stocks?v=${version}&u=${universe}`;

  // The symbol's scorecard row (search is bounded, so a small page is plenty).
  const { rows: scRows } = useReportSymbols(current, { q: symbol, pageSize: 50 });
  const row = useMemo(() => scRows.find((r) => r.Symbol === symbol) ?? null, [scRows, symbol]);

  const [page, setPage] = useState(1);
  const { rows: trades, total, isLoading: tlLoading, available } = useReportTradeLog(current, symbol, {
    page,
    pageSize: PAGE_SIZE,
  });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (isLoading) {
    return <StockDetailSkeleton />;
  }

  return (
    <div className="p-8 space-y-6 max-w-[1600px]">
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="icon">
          <Link to={backHref} aria-label="Back to stock performance">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="font-display text-lg font-semibold tracking-tight flex items-center gap-2">
            <span className="font-mono">{symbol}</span>
            {row && (
              <span className={`rounded-md px-2 py-0.5 text-[11px] ring-1 ${verdictTone[row.Verdict]}`}>
                {row.Verdict}
              </span>
            )}
          </h1>
          <p className="text-xs text-muted-foreground">
            {STRATEGY.toLowerCase().replace(/\s+/g, "-")}-v{current?.version ?? "—"} · {current?.universe ?? "—"}
            {row?.Sector ? ` · ${row.Sector}` : ""}
            {row?.["Market Cap"] ? ` · ${row["Market Cap"]}` : ""}
          </p>
        </div>
      </div>

      {row ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <Metric label="Trades" value={String(row.Trades ?? "—")} />
          <Metric label="Win rate" value={pct(row["Win Rate %"], 1)} />
          <Metric label="Net P&L" value={inr(row["Net P&L (Rs)"])} tone={(row["Net P&L (Rs)"] ?? 0) >= 0 ? "pos" : "neg"} />
          <Metric label="Profit factor" value={num(row["Profit Factor"])} />
          <Metric label="Sharpe" value={num(row["Sharpe Ratio"])} />
          <Metric label="Avg hold" value={row["Avg Hold (weeks)"] != null ? `${num(row["Avg Hold (weeks)"], 1)}w` : "—"} />
          <Metric label="Best trade" value={pct(row["Best Trade %"], 1)} tone="pos" />
          <Metric label="Worst trade" value={pct(row["Worst Trade %"], 1)} tone="neg" />
          <Metric label="Gross profit" value={inr(row["Gross Profit (Rs)"])} tone="pos" />
          <Metric label="Gross loss" value={inr(row["Gross Loss (Rs)"])} tone="neg" />
          <Metric label="Charges" value={inr(row["Total Charges (Rs)"])} tone="neg" />
          <Metric label="Avg trade" value={pct(row["Avg Trade %"], 2)} />
        </div>
      ) : (
        <NotAvailable label={`No scorecard entry for ${symbol} in this version`} />
      )}

      <Section title="Trades" desc={`Every ${symbol} trade in this backtest`} icon={Receipt}>
        {!available ? (
          <NotAvailable
            label="Trade log isn't available for this version"
            hint="Live variants don't carry a flat per-trade log — open an uploaded archive version to see individual trades."
          />
        ) : tlLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Loading trades…</div>
        ) : trades.length === 0 ? (
          <NotAvailable label={`No trades recorded for ${symbol}`} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[920px]">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-[0.16em] text-muted-foreground border-b border-border/60">
                    <th className="py-3 pr-4 font-medium">#</th>
                    <th className="px-4 py-3 font-medium">Entry date</th>
                    <th className="px-4 py-3 font-medium">Exit date</th>
                    <th className="px-4 py-3 font-medium text-right">Weeks</th>
                    <th className="px-4 py-3 font-medium text-right">Entry</th>
                    <th className="px-4 py-3 font-medium text-right">Exit</th>
                    <th className="px-4 py-3 font-medium text-right">Size</th>
                    <th className="px-4 py-3 font-medium text-right">P&amp;L</th>
                    <th className="px-4 py-3 font-medium text-right">Return</th>
                    <th className="px-4 py-3 font-medium">Exit reason</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((t, i) => {
                    const up = (t["Return (%)"] ?? 0) >= 0;
                    return (
                      <tr key={`${t["Entry Date"]}-${i}`} className="border-b border-border/40 last:border-0 hover:bg-accent/30">
                        <td className="py-3 pr-4 tabular-nums text-muted-foreground">{t["#"] ?? (page - 1) * PAGE_SIZE + i + 1}</td>
                        <td className="px-4 py-3 text-xs">{t["Entry Date"] ?? "—"}</td>
                        <td className="px-4 py-3 text-xs">{t["Exit Date"] ?? "—"}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{t["Duration (weeks)"] ?? "—"}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{inr(t["Entry Price"])}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{inr(t["Exit Price"])}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{t.Size ?? "—"}</td>
                        <td className={`px-4 py-3 text-right tabular-nums ${(t["P&L (Rs)"] ?? 0) >= 0 ? "text-primary" : "text-destructive"}`}>
                          {inr(t["P&L (Rs)"])}
                        </td>
                        <td className={`px-4 py-3 text-right tabular-nums ${up ? "text-primary" : "text-destructive"}`}>
                          {pct(t["Return (%)"], 1)}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{t["Exit Reason"] ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 text-sm">
                <span className="text-muted-foreground tabular-nums">
                  Page {page} of {totalPages} · {total} trades
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
          </>
        )}
      </Section>

      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <TrendingUp className="size-3" /> Tip: switch versions from the Stock performance tab, then drill back into a symbol.
      </p>
    </div>
  );
}
