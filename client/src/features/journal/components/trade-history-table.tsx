import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Filter, Info, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { fmtPrice, fmtSignedINR } from "../utils/journal-utils";
import { metricsFor } from "./trade-history-kpis";
import type { JournalTrade } from "../types/journal.types";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });

const OUTCOME_STYLE: Record<string, string> = {
  TARGET: "bg-primary/10 text-primary border-primary/30",
  STOP: "bg-destructive/10 text-destructive border-destructive/30",
  "TREND-FLIP": "bg-sky-500/10 text-sky-400 border-sky-500/30",
  "MANUAL-EXIT": "bg-amber-500/10 text-amber-400 border-amber-500/30",
};

/** Net P&L when the backend computed it (charges-aware); falls back to the
 * gross figure for trades closed before charges tracking existed. */
function netPnlFor(t: JournalTrade, gross: number): number {
  return t.exit?.netPnlAmount ?? gross;
}

export function TradeHistoryTable({ trades }: { trades: JournalTrade[] }) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return trades;
    return trades.filter(
      (t) =>
        t.entry.ticker.toLowerCase().includes(q) ||
        (t.entry.sector ?? "").toLowerCase().includes(q) ||
        t.outcome.toLowerCase().includes(q),
    );
  }, [trades, query]);

  return (
    <TooltipProvider>
    <Card className="border-border/60 bg-card/60 backdrop-blur overflow-hidden">
      <CardHeader className="pb-4 flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="text-base font-medium">Closed trades</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Click any row for the full entry, exit and charges breakdown.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search symbol, outcome…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8 h-9 w-[240px] bg-secondary/40"
            />
          </div>
          <Button variant="outline" size="sm" className="h-9 gap-2">
            <Filter className="size-3.5" /> Filter
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {rows.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            {trades.length === 0
              ? "No closed trades yet. They appear here once you exit an open position."
              : "No trades match your search."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/60">
                  <TableHead className="w-10 pl-6">#</TableHead>
                  <TableHead className="w-[200px]">Symbol</TableHead>
                  <TableHead>Entry date</TableHead>
                  <TableHead>Exit date</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Entry</TableHead>
                  <TableHead className="text-right">Exit</TableHead>
                  <TableHead className="text-right">Gross P&amp;L</TableHead>
                  <TableHead className="text-right">Charges</TableHead>
                  <TableHead className="text-right">Realised P&amp;L</TableHead>
                  <TableHead className="text-right">Days</TableHead>
                  <TableHead className="text-right">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex items-center gap-1 cursor-help">
                          R <Info className="size-3 text-muted-foreground" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[260px] text-left">
                        R-multiple = profit ÷ risk per share. Normally "risk" is
                        the entry-to-stop-loss distance, but Trend+RS-55 has no
                        stop-loss. Trades without one use ATR(14) at entry
                        instead (marked "vs ATR") — profit measured against the
                        stock's typical daily swing, not a real stop distance.
                      </TooltipContent>
                    </Tooltip>
                  </TableHead>
                  <TableHead>Outcome</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((t, i) => (
                  <HistoryRow
                    key={t.id}
                    t={t}
                    index={i + 1}
                    onOpen={() => navigate(`/trades/${t.id}`)}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
    </TooltipProvider>
  );
}

function HistoryRow({
  t,
  index,
  onOpen,
}: {
  t: JournalTrade;
  index: number;
  onOpen: () => void;
}) {
  const e = t.entry;
  const x = t.exit;
  const m = metricsFor(t);
  const gross = m?.realizedPnl ?? 0;
  const grossPct = m?.realizedPnlPct ?? 0;
  const net = m ? netPnlFor(t, gross) : 0;
  const netPct =
    m && e.entryPrice * e.quantity > 0 ? (net / (e.entryPrice * e.quantity)) * 100 : 0;
  const charges = x?.charges?.totalCharges ?? null;

  return (
    <TableRow
      onClick={onOpen}
      className="cursor-pointer border-border/60 transition-colors hover:bg-accent/20"
    >
      <TableCell className="pl-6 tabular text-muted-foreground">{index}</TableCell>
      <TableCell className="py-4">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-lg grid place-items-center text-[11px] font-semibold tabular tracking-wide bg-secondary/60 text-foreground ring-1 ring-border/70 shrink-0">
            {e.ticker.slice(0, 2)}
          </div>
          <div className="leading-tight">
            <div className="font-medium tracking-wide tabular">{e.ticker}</div>
            <div className="text-xs text-muted-foreground">
              {[e.sector, e.marketCapCategory].filter(Boolean).join(" · ") || "—"}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground tabular whitespace-nowrap">
        {fmtDate(e.entryDate)}
      </TableCell>
      <TableCell className="text-muted-foreground tabular whitespace-nowrap">
        {x ? fmtDate(x.exitDate) : "—"}
      </TableCell>
      <TableCell className="text-right tabular">{e.quantity}</TableCell>
      <TableCell className="text-right tabular text-muted-foreground">
        {fmtPrice(e.entryPrice)}
      </TableCell>
      <TableCell className="text-right tabular text-muted-foreground">
        {x ? fmtPrice(x.exitPrice) : "—"}
      </TableCell>
      <TableCell className="text-right tabular">
        {m ? (
          <div className="leading-tight">
            <div className={cn("font-medium", gross >= 0 ? "text-primary" : "text-destructive")}>
              {fmtSignedINR(gross)}
            </div>
            <div className={cn("text-xs", gross >= 0 ? "text-primary" : "text-destructive")}>
              {grossPct >= 0 ? "+" : ""}
              {grossPct.toFixed(2)}%
            </div>
          </div>
        ) : (
          "—"
        )}
      </TableCell>
      <TableCell className="text-right tabular text-muted-foreground">
        {charges != null ? `−${fmtPrice(charges)}` : "—"}
      </TableCell>
      <TableCell className="text-right tabular">
        {m ? (
          <div className="leading-tight">
            <div className={cn("font-medium", net >= 0 ? "text-primary" : "text-destructive")}>
              {fmtSignedINR(net)}
            </div>
            <div className={cn("text-xs", net >= 0 ? "text-primary" : "text-destructive")}>
              {netPct >= 0 ? "+" : ""}
              {netPct.toFixed(2)}%
            </div>
          </div>
        ) : (
          "—"
        )}
      </TableCell>
      <TableCell className="text-right tabular text-muted-foreground">
        {m ? `${m.daysHeld}d` : "—"}
      </TableCell>
      <TableCell
        className={cn(
          "text-right tabular",
          m?.rMultiple != null && (m.rMultiple >= 0 ? "text-primary" : "text-destructive"),
        )}
      >
        {m?.rMultiple != null ? (
          <div className="leading-tight">
            <div>
              {m.rMultiple >= 0 ? "+" : ""}
              {m.rMultiple.toFixed(2)}R
            </div>
            {m.rMultipleBasis === "atr" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-[10px] text-muted-foreground font-normal cursor-help underline decoration-dotted underline-offset-2">
                    vs ATR
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[260px] text-left">
                  No stop-loss on this trade, so R is measured against ATR(14) at
                  entry (the stock's typical daily swing) instead of a real risk
                  distance — not the standard R-multiple calculation.
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        ) : (
          "—"
        )}
      </TableCell>
      <TableCell>
        <Badge
          className={cn(
            "border hover:bg-transparent",
            OUTCOME_STYLE[t.outcome] ?? "bg-secondary/50 text-muted-foreground border-border/60",
          )}
        >
          {t.outcome}
        </Badge>
      </TableCell>
    </TableRow>
  );
}
