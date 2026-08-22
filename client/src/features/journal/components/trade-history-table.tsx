import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
  Clock,
  Filter,
  Receipt,
  Search,
  Shield,
  Sparkles,
  Target,
} from "lucide-react";
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
  const [expanded, setExpanded] = useState<string | null>(null);

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
            Click any row to inspect the entry, exit and charges.
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
                <TableHead className="text-right">Net P&amp;L</TableHead>
                <TableHead>Outcome</TableHead>
                <TableHead className="text-right pr-6" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((t) => (
                <HistoryRow
                  key={t.id}
                  t={t}
                  open={expanded === t.id}
                  onToggle={() => setExpanded(expanded === t.id ? null : t.id)}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function HistoryRow({
  t,
  open,
  onToggle,
}: {
  t: JournalTrade;
  open: boolean;
  onToggle: () => void;
}) {
  const e = t.entry;
  const m = metricsFor(t);
  const net = m ? netPnlFor(t, m.realizedPnl) : 0;
  const netPct = m && e.entryPrice * e.quantity > 0 ? (net / (e.entryPrice * e.quantity)) * 100 : 0;
  const positive = net >= 0;

  return (
    <>
      <TableRow
        onClick={onToggle}
        className={cn(
          "cursor-pointer border-border/60 transition-colors",
          open ? "bg-accent/40 hover:bg-accent/40" : "hover:bg-accent/20",
        )}
      >
        <TableCell className="pl-6 py-4">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg grid place-items-center text-[11px] font-semibold tabular tracking-wide bg-secondary/60 text-foreground ring-1 ring-border/70">
              {e.ticker.slice(0, 2)}
            </div>
            <div className="leading-tight">
              <div className="font-medium tracking-wide tabular">
                <Link
                  to={`/trades/${t.id}`}
                  onClick={(ev) => ev.stopPropagation()}
                  className="hover:text-primary hover:underline underline-offset-4"
                >
                  {e.ticker}
                </Link>
              </div>
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
        <TableCell className="text-right tabular">
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
        <TableCell className="text-right pr-6">
          <ChevronDown
            className={cn(
              "size-4 text-muted-foreground transition-transform inline",
              open && "rotate-180",
            )}
          />
        </TableCell>
      </TableRow>

      {open && (
        <TableRow className="hover:bg-transparent border-border/60">
          <TableCell colSpan={7} className="p-0">
            <ExpandedDetails t={t} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function ExpandedDetails({ t }: { t: JournalTrade }) {
  const e = t.entry;
  const x = t.exit;
  const m = metricsFor(t);
  const trendRs55 = isTrendRs55(t);
  const gross = m?.realizedPnl ?? 0;
  const net = m ? netPnlFor(t, gross) : 0;
  const charges = x?.charges?.totalCharges ?? null;
  const note = x?.aiAnalysis || x?.manualExitReason || null;

  return (
    <div className="bg-background/40 border-t border-border/60 p-6 space-y-6">
      <div className="grid grid-cols-12 gap-6">
        <DetailBlock title="Entry" icon={<Target className="size-3.5 text-primary" />}>
          <DetailRow label="Entry price" value={fmtPrice(e.entryPrice)} mono />
          <DetailRow label="Quantity" value={String(e.quantity)} />
          <DetailRow label="Entry date" value={fmtDate(e.entryDate)} />
          {trendRs55 ? (
            <DetailRow
              label="RS-55 at entry"
              value={e.rs55Pct != null ? `${e.rs55Pct.toFixed(2)}%` : "—"}
              tone="good"
            />
          ) : (
            <>
              <DetailRow label="Target" value={fmtPrice(e.targetPrice)} mono tone="good" />
              <DetailRow label="Stop" value={fmtPrice(e.stopPrice)} mono tone="bad" />
            </>
          )}
        </DetailBlock>

        <DetailBlock title="Exit" icon={<Shield className="size-3.5 text-primary" />}>
          <DetailRow label="Exit price" value={x ? fmtPrice(x.exitPrice) : "—"} mono />
          <DetailRow label="Outcome" value={t.outcome} />
          <DetailRow label="Exit date" value={x ? fmtDate(x.exitDate) : "—"} />
          {x?.quantity != null && x.quantity !== e.quantity && (
            <DetailRow label="Exited qty" value={String(x.quantity)} />
          )}
        </DetailBlock>

        <DetailBlock title="Result" icon={<Activity className="size-3.5 text-primary" />}>
          <DetailRow
            label="Gross P&L"
            value={m ? fmtSignedINR(gross) : "—"}
            tone={gross >= 0 ? "good" : "bad"}
          />
          <DetailRow
            label="Charges"
            value={charges != null ? `−${fmtPrice(charges)}` : "—"}
            tone="muted"
          />
          <DetailRow
            label="Net P&L"
            value={m ? fmtSignedINR(net) : "—"}
            tone={net >= 0 ? "good" : "bad"}
          />
          {m?.rMultiple != null && (
            <DetailRow
              label="R multiple"
              value={`${m.rMultiple >= 0 ? "+" : ""}${m.rMultiple.toFixed(2)}R`}
              tone={m.rMultiple >= 0 ? "good" : "bad"}
            />
          )}
        </DetailBlock>

        <DetailBlock title="Setup" icon={<Clock className="size-3.5 text-primary" />}>
          <DetailRow label="Days held" value={m ? `${m.daysHeld}d` : "—"} />
          <DetailRow label="Sector" value={e.sector || "—"} />
          {trendRs55 ? (
            <DetailRow label="Market cap" value={e.marketCapCategory || "—"} />
          ) : (
            <>
              <DetailRow label="RSI(2) at entry" value={e.rsi2.toFixed(2)} />
              <DetailRow label="ATR(14)" value={fmtPrice(e.atr14)} mono />
            </>
          )}
        </DetailBlock>
      </div>

      {(note || charges != null) && (
        <div className="grid grid-cols-12 gap-6">
          {note && (
            <div className="col-span-12 lg:col-span-8 rounded-xl border border-border/60 bg-card/40 p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                <span className="size-5 rounded-md grid place-items-center bg-primary/10 ring-1 ring-primary/20">
                  <Sparkles className="size-3.5 text-primary" />
                </span>
                Exit note
              </div>
              <p className="mt-3 text-sm leading-relaxed text-foreground whitespace-pre-wrap break-words">
                {note}
              </p>
            </div>
          )}

          {charges != null && x?.charges && (
            <div className="col-span-12 lg:col-span-4 rounded-xl border border-border/60 bg-card/40 p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                <span className="size-5 rounded-md grid place-items-center bg-primary/10 ring-1 ring-primary/20">
                  <Receipt className="size-3.5 text-primary" />
                </span>
                Charges breakdown
              </div>
              <div className="mt-3 space-y-2.5">
                <DetailRow label="STT" value={fmtPrice(x.charges.stt)} mono />
                <DetailRow label="Exchange" value={fmtPrice(x.charges.exchangeCharges)} mono />
                <DetailRow label="SEBI" value={fmtPrice(x.charges.sebiCharges)} mono />
                <DetailRow label="Stamp duty" value={fmtPrice(x.charges.stampDuty)} mono />
                <DetailRow label="DP" value={fmtPrice(x.charges.dpCharges)} mono />
                <DetailRow label="GST" value={fmtPrice(x.charges.gst)} mono />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DetailBlock({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="col-span-12 md:col-span-6 xl:col-span-3 rounded-xl border border-border/60 bg-card/40 p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
        <span className="size-5 rounded-md grid place-items-center bg-primary/10 ring-1 ring-primary/20">
          {icon}
        </span>
        {title}
      </div>
      <div className="mt-3 space-y-2.5">{children}</div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
  tone,
}: {
  label: string;
  value: string;
  mono?: boolean;
  tone?: "good" | "bad" | "muted";
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span
        className={cn(
          "text-right truncate",
          mono && "tabular",
          tone === "good" && "text-primary",
          tone === "bad" && "text-destructive",
          tone === "muted" && "text-muted-foreground",
          !tone && "text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}
