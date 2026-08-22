import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Filter, LogOut, Search, Sparkles } from "lucide-react";
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
import { fmtPrice, fmtSignedINR, isTrendRs55 } from "../utils/journal-utils";
import { ExitPositionDialog } from "./exit-position-dialog";
import { AiReviewDialog } from "./ai-review-dialog";
import type { JournalTrade } from "../types/journal.types";

const holdingDays = (iso: string) =>
  Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));

export function OpenPositionsTable({ trades }: { trades: JournalTrade[] }) {
  const [query, setQuery] = useState("");
  const [exiting, setExiting] = useState<JournalTrade | null>(null);
  const [reviewingAi, setReviewingAi] = useState<JournalTrade | null>(null);
  const navigate = useNavigate();

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return trades;
    return trades.filter(
      (t) =>
        t.entry.ticker.toLowerCase().includes(q) ||
        (t.entry.sector ?? "").toLowerCase().includes(q),
    );
  }, [trades, query]);

  return (
    <>
      <Card className="border-border/60 bg-card/60 backdrop-blur overflow-hidden">
        <CardHeader className="pb-4 flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base font-medium">
              Open positions
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Click any row for the full setup, chart and AI review.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search symbol, sector…"
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
                ? "No open positions yet. Use \"Add Entry\" above to record one."
                : "No positions match your search."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/60">
                    <TableHead className="w-[240px] pl-6">Symbol</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Entry</TableHead>
                    <TableHead className="text-right">RS-55</TableHead>
                    <TableHead className="text-right">Since entry</TableHead>
                    <TableHead className="text-right">Mark / P&amp;L</TableHead>
                    <TableHead className="text-right">Today</TableHead>
                    <TableHead className="text-right">Held</TableHead>
                    <TableHead className="text-right pr-6">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((t) => (
                    <PositionRow
                      key={t.id}
                      t={t}
                      onOpen={() => navigate(`/trades/${t.id}`)}
                      onExit={() => setExiting(t)}
                      onAiReview={() => setReviewingAi(t)}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ExitPositionDialog trade={exiting} onClose={() => setExiting(null)} />
      <AiReviewDialog
        trade={reviewingAi}
        onClose={() => setReviewingAi(null)}
      />
    </>
  );
}

function PositionRow({
  t,
  onOpen,
  onExit,
  onAiReview,
}: {
  t: JournalTrade;
  onOpen: () => void;
  onExit: () => void;
  onAiReview: () => void;
}) {
  const e = t.entry;
  const trendRs55 = isTrendRs55(t);
  return (
    <TableRow
      onClick={onOpen}
      className="cursor-pointer border-border/60 transition-colors hover:bg-accent/20"
    >
      <TableCell className="pl-6 py-4">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-lg grid place-items-center text-[11px] font-semibold tabular tracking-wide bg-primary/15 text-primary ring-1 ring-primary/30">
            {e.ticker.slice(0, 2)}
          </div>
          <div className="leading-tight">
            <div className="font-medium tracking-wide tabular flex items-center gap-2">
              {e.ticker}
              <Badge
                className={cn(
                  "border h-4 px-1.5 text-[10px] font-medium",
                  e.direction === "LONG"
                    ? "bg-primary/10 text-primary border-primary/30 hover:bg-primary/10"
                    : "bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/10",
                )}
              >
                {e.direction}
              </Badge>
              {t.source === "auto" && (
                <Badge className="border h-4 px-1 text-[9px] bg-secondary/50 text-muted-foreground border-border/60 hover:bg-secondary/50">
                  AUTO
                </Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {[e.sector, e.marketCapCategory].filter(Boolean).join(" · ") || "—"}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-right tabular">{e.quantity}</TableCell>
      <TableCell className="text-right tabular text-muted-foreground">
        {fmtPrice(e.entryPrice)}
      </TableCell>
      <TableCell className="text-right tabular">
        {trendRs55
          ? e.rs55Pct != null
            ? `${e.rs55Pct >= 0 ? "+" : ""}${e.rs55Pct.toFixed(1)}%`
            : "—"
          : e.rsi2.toFixed(2)}
      </TableCell>
      <TableCell className="text-right tabular">
        <SinceEntryCell t={t} />
      </TableCell>
      <TableCell className="text-right tabular">
        <MarkCell t={t} />
      </TableCell>
      <TableCell className="text-right tabular">
        <TodayChangeCell t={t} />
      </TableCell>
      <TableCell className="text-right tabular text-muted-foreground">
        {holdingDays(e.entryDate)}d
      </TableCell>
      <TableCell className="text-right pr-6">
        <div className="flex items-center justify-end gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 border-border/70"
            onClick={(ev) => {
              ev.stopPropagation();
              onAiReview();
            }}
          >
            <Sparkles className="size-3.5" /> AI review
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={(ev) => {
              ev.stopPropagation();
              onExit();
            }}
          >
            <LogOut className="size-3.5" /> Exit
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

/** % move since entry, from the last broker-sync mark. Dash when a trade has
 * never been synced (manual entries, or before the first sync). */
function SinceEntryCell({ t }: { t: JournalTrade }) {
  if (t.markPrice == null) {
    return <span className="text-muted-foreground">—</span>;
  }
  const long = t.entry.direction !== "SHORT";
  const pct = long
    ? ((t.markPrice - t.entry.entryPrice) / t.entry.entryPrice) * 100
    : ((t.entry.entryPrice - t.markPrice) / t.entry.entryPrice) * 100;
  return (
    <span className={pct >= 0 ? "text-primary" : "text-destructive"}>
      {pct >= 0 ? "+" : ""}
      {pct.toFixed(2)}%
    </span>
  );
}

/** Today's % move (mark vs the previous trading day's close) — distinct from
 * the since-entry move. Dash when there's no mark yet or no prior close
 * (first day phalanx-live has data for this symbol). */
function TodayChangeCell({ t }: { t: JournalTrade }) {
  if (t.markPrice == null || t.markPrevClose == null) {
    return <span className="text-muted-foreground">—</span>;
  }
  const pct = ((t.markPrice - t.markPrevClose) / t.markPrevClose) * 100;
  return (
    <span className={pct >= 0 ? "text-primary" : "text-destructive"}>
      {pct >= 0 ? "+" : ""}
      {pct.toFixed(2)}%
    </span>
  );
}

/** Live mark + unrealized P&L, from the last broker-sync mark. Dash when a
 * trade has never been synced (manual entries, or before the first sync). */
function MarkCell({ t }: { t: JournalTrade }) {
  if (t.markPrice == null) {
    return <span className="text-muted-foreground">—</span>;
  }
  const long = t.entry.direction !== "SHORT";
  const pnlPerShare = long
    ? t.markPrice - t.entry.entryPrice
    : t.entry.entryPrice - t.markPrice;
  const pnl = pnlPerShare * t.entry.quantity;
  return (
    <div className="leading-tight">
      <div>{fmtPrice(t.markPrice)}</div>
      <div
        className={`text-xs ${pnl >= 0 ? "text-primary" : "text-destructive"}`}
      >
        {fmtSignedINR(pnl)}
      </div>
    </div>
  );
}
