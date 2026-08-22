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

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });

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
                    <TableHead className="w-10 pl-6 pr-3">#</TableHead>
                    <TableHead className="w-[200px] pl-3 pr-3">Symbol</TableHead>
                    <TableHead className="pl-3 pr-3">Entry date</TableHead>
                    <TableHead className="pl-3 pr-3 text-right">Qty</TableHead>
                    <TableHead className="pl-3 pr-3 text-right">Entry</TableHead>
                    <TableHead className="pl-3 pr-3 text-right">RS-55 (Mansfield)</TableHead>
                    <TableHead className="pl-3 pr-3 text-right">LTP</TableHead>
                    <TableHead className="pl-3 pr-3 text-right">P&amp;L</TableHead>
                    <TableHead className="pl-3 pr-3 text-right">Daily P&amp;L</TableHead>
                    <TableHead className="pl-3 pr-3 text-right">Held</TableHead>
                    <TableHead className="pl-3 pr-6 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((t, i) => (
                    <PositionRow
                      key={t.id}
                      t={t}
                      index={i + 1}
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
  index,
  onOpen,
  onExit,
  onAiReview,
}: {
  t: JournalTrade;
  index: number;
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
      <TableCell className="pl-6 pr-3 py-3 tabular text-muted-foreground">{index}</TableCell>
      <TableCell className="pl-3 pr-3 py-3">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-lg grid place-items-center text-[11px] font-semibold tabular tracking-wide bg-primary/15 text-primary ring-1 ring-primary/30 shrink-0">
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
      <TableCell className="pl-3 pr-3 py-3 text-muted-foreground tabular whitespace-nowrap">
        {fmtDate(e.entryDate)}
      </TableCell>
      <TableCell className="pl-3 pr-3 py-3 text-right tabular">{e.quantity}</TableCell>
      <TableCell className="pl-3 pr-3 py-3 text-right tabular text-muted-foreground">
        {fmtPrice(e.entryPrice)}
      </TableCell>
      <TableCell className="pl-3 pr-3 py-3 text-right tabular">
        <MansfieldRsCell t={t} trendRs55={trendRs55} />
      </TableCell>
      <TableCell className="pl-3 pr-3 py-3 text-right tabular">{fmtPrice(t.markPrice)}</TableCell>
      <TableCell className="pl-3 pr-3 py-3 text-right tabular">
        <PnlCell t={t} />
      </TableCell>
      <TableCell className="pl-3 pr-3 py-3 text-right tabular">
        <DailyPnlCell t={t} />
      </TableCell>
      <TableCell className="pl-3 pr-3 py-3 text-right tabular text-muted-foreground">
        {holdingDays(e.entryDate)}d
      </TableCell>
      <TableCell className="pl-3 pr-6 py-3 text-right">
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

/** Current Mansfield RS (vs Nifty, EMA 55) — a live reading refreshed daily,
 * not the frozen rank-based value from the entry signal. For legacy (non
 * trend-rs55) trades, falls back to RSI(2) since Mansfield RS isn't
 * meaningful for that strategy. */
function MansfieldRsCell({ t, trendRs55 }: { t: JournalTrade; trendRs55: boolean }) {
  if (!trendRs55) {
    return <span className="text-muted-foreground">{t.entry.rsi2.toFixed(2)}</span>;
  }
  if (t.markRs == null) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <span className={t.markRs >= 0 ? "text-primary" : "text-destructive"}>
      {t.markRs >= 0 ? "+" : ""}
      {t.markRs.toFixed(2)}%
    </span>
  );
}

/** P&L since entry — ₹ on top, % below. Dash when there's no mark yet. */
function PnlCell({ t }: { t: JournalTrade }) {
  if (t.markPrice == null) {
    return <span className="text-muted-foreground">—</span>;
  }
  const long = t.entry.direction !== "SHORT";
  const pnlPerShare = long
    ? t.markPrice - t.entry.entryPrice
    : t.entry.entryPrice - t.markPrice;
  const pnl = pnlPerShare * t.entry.quantity;
  const pct = (pnlPerShare / t.entry.entryPrice) * 100;
  const tone = pnl >= 0 ? "text-primary" : "text-destructive";
  return (
    <div className="leading-tight">
      <div className={cn("font-medium", tone)}>{fmtSignedINR(pnl)}</div>
      <div className={cn("text-xs", tone)}>
        {pct >= 0 ? "+" : ""}
        {pct.toFixed(2)}%
      </div>
    </div>
  );
}

/** Today's P&L (mark vs previous close) — ₹ on top, % below. Dash when
 * there's no mark yet or no prior close (first day of tracking). */
function DailyPnlCell({ t }: { t: JournalTrade }) {
  if (t.markPrice == null || t.markPrevClose == null) {
    return <span className="text-muted-foreground">—</span>;
  }
  const pctPerShare = t.markPrice - t.markPrevClose;
  const pnl = pctPerShare * t.entry.quantity;
  const pct = (pctPerShare / t.markPrevClose) * 100;
  const tone = pnl >= 0 ? "text-primary" : "text-destructive";
  return (
    <div className="leading-tight">
      <div className={cn("font-medium", tone)}>{fmtSignedINR(pnl)}</div>
      <div className={cn("text-xs", tone)}>
        {pct >= 0 ? "+" : ""}
        {pct.toFixed(2)}%
      </div>
    </div>
  );
}
