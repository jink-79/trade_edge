import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowDownRight, ArrowUpRight, Filter, Search } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { fmtPrice, fmtSignedINR } from "../utils/journal-utils";
import { metricsFor } from "./trade-history-kpis";
import type { JournalTrade } from "../types/journal.types";

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
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/60">
                <TableHead className="w-[240px] pl-6">Symbol</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Entry → Exit</TableHead>
                <TableHead className="text-right">Days</TableHead>
                <TableHead className="text-right pr-6">Net P&amp;L</TableHead>
                <TableHead>Outcome</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((t) => (
                <HistoryRow key={t.id} t={t} onOpen={() => navigate(`/trades/${t.id}`)} />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function HistoryRow({ t, onOpen }: { t: JournalTrade; onOpen: () => void }) {
  const e = t.entry;
  const m = metricsFor(t);
  const net = m ? netPnlFor(t, m.realizedPnl) : 0;
  const netPct = m && e.entryPrice * e.quantity > 0 ? (net / (e.entryPrice * e.quantity)) * 100 : 0;
  const positive = net >= 0;

  return (
    <TableRow
      onClick={onOpen}
      className="cursor-pointer border-border/60 transition-colors hover:bg-accent/20"
    >
      <TableCell className="pl-6 py-4">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-lg grid place-items-center text-[11px] font-semibold tabular tracking-wide bg-secondary/60 text-foreground ring-1 ring-border/70">
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
      <TableCell className="text-right tabular">{e.quantity}</TableCell>
      <TableCell className="text-right tabular text-muted-foreground">
        {fmtPrice(e.entryPrice)} → {t.exit ? fmtPrice(t.exit.exitPrice) : "—"}
      </TableCell>
      <TableCell className="text-right tabular text-muted-foreground">
        {m ? `${m.daysHeld}d` : "—"}
      </TableCell>
      <TableCell className="text-right tabular pr-6">
        <div className="leading-tight">
          <div className={cn("font-medium", positive ? "text-primary" : "text-destructive")}>
            {m ? fmtSignedINR(net) : "—"}
          </div>
          {m && (
            <div
              className={cn(
                "text-xs inline-flex items-center gap-0.5",
                positive ? "text-primary" : "text-destructive",
              )}
            >
              {positive ? (
                <ArrowUpRight className="size-3" />
              ) : (
                <ArrowDownRight className="size-3" />
              )}
              {Math.abs(netPct).toFixed(2)}%
            </div>
          )}
        </div>
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
