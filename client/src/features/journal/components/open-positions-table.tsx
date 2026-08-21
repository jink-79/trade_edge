import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Filter,
  ListChecks,
  LogOut,
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
import {
  deriveEntryMetrics,
  fmtINR,
  fmtPrice,
  fmtSignedINR,
  isTrendRs55,
} from "../utils/journal-utils";
import { useSetGttPlaced } from "../hooks/use-journal";
import { ExitPositionDialog } from "./exit-position-dialog";
import { AiReviewDialog } from "./ai-review-dialog";
import type { JournalTrade } from "../types/journal.types";

const KITE_GTT_URL = "https://kite.zerodha.com/gtt";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });

const holdingDays = (iso: string) =>
  Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));

export function OpenPositionsTable({
  trades,
  capital,
}: {
  trades: JournalTrade[];
  capital: number;
}) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(
    trades[0]?.id ?? null,
  );
  const [exiting, setExiting] = useState<JournalTrade | null>(null);
  const [reviewingAi, setReviewingAi] = useState<JournalTrade | null>(null);

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
              Click any row to inspect the setup, risk and price levels.
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
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/60">
                  <TableHead className="w-[240px] pl-6">Symbol</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Entry</TableHead>
                  <TableHead className="text-right">RS-55</TableHead>
                  <TableHead className="text-right">Since entry</TableHead>
                  <TableHead className="text-right">Mark / P&amp;L</TableHead>
                  <TableHead className="text-right pr-6">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((t) => (
                  <PositionRow
                    key={t.id}
                    t={t}
                    capital={capital}
                    open={expanded === t.id}
                    onToggle={() =>
                      setExpanded(expanded === t.id ? null : t.id)
                    }
                    onExit={() => setExiting(t)}
                    onAiReview={() => setReviewingAi(t)}
                  />
                ))}
              </TableBody>
            </Table>
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
  capital,
  open,
  onToggle,
  onExit,
  onAiReview,
}: {
  t: JournalTrade;
  capital: number;
  open: boolean;
  onToggle: () => void;
  onExit: () => void;
  onAiReview: () => void;
}) {
  const e = t.entry;
  const trendRs55 = isTrendRs55(t);
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
            <div className="size-9 rounded-lg grid place-items-center text-[11px] font-semibold tabular tracking-wide bg-primary/15 text-primary ring-1 ring-primary/30">
              {e.ticker.slice(0, 2)}
            </div>
            <div className="leading-tight">
              <div className="font-medium tracking-wide tabular flex items-center gap-2">
                <Link
                  to={`/trades/${t.id}`}
                  onClick={(ev) => ev.stopPropagation()}
                  className="hover:text-primary hover:underline underline-offset-4"
                >
                  {e.ticker}
                </Link>
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
            <ChevronDown
              className={cn(
                "size-4 text-muted-foreground transition-transform",
                open && "rotate-180",
              )}
            />
          </div>
        </TableCell>
      </TableRow>

      {open && (
        <TableRow className="hover:bg-transparent border-border/60">
          <TableCell colSpan={7} className="p-0">
            <ExpandedDetails t={t} capital={capital} />
          </TableCell>
        </TableRow>
      )}
    </>
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

function ExpandedDetails({
  t,
  capital,
}: {
  t: JournalTrade;
  capital: number;
}) {
  const setGtt = useSetGttPlaced();
  const e = t.entry;
  const trendRs55 = isTrendRs55(t);
  const m = deriveEntryMetrics(
    {
      direction: e.direction,
      entryPrice: e.entryPrice,
      stopPrice: e.stopPrice,
      targetPrice: e.targetPrice,
      quantity: e.quantity,
      atr14: e.atr14,
    },
    capital,
  );

  return (
    <div className="bg-background/40 border-t border-border/60 p-6 grid grid-cols-12 gap-6">
      {trendRs55 ? (
        <DetailBlock
          title="Exit rule"
          icon={<Shield className="size-3.5 text-primary" />}
        >
          <DetailRow label="Exit signal" value="Trend flip" />
          <DetailRow
            label="RS-55 at entry"
            value={e.rs55Pct != null ? `${e.rs55Pct.toFixed(2)}%` : "—"}
            tone="good"
          />
          <DetailRow
            label="Capital deployed"
            value={fmtINR(m.capitalDeployed)}
          />
        </DetailBlock>
      ) : (
        <DetailBlock
          title="Risk & reward"
          icon={<Shield className="size-3.5 text-primary" />}
        >
          <DetailRow label="Stop-loss" value={fmtPrice(e.stopPrice)} mono tone="bad" />
          <DetailRow
            label="Capital at risk"
            value={fmtINR(m.capitalAtRisk ?? 0)}
            tone="bad"
          />
          <DetailRow
            label="Risk / share"
            value={fmtPrice(m.initialRiskPerShare)}
            mono
          />
          <DetailRow
            label="Planned R:R"
            value={m.plannedRR != null ? `${m.plannedRR.toFixed(2)} : 1` : "—"}
          />
        </DetailBlock>
      )}

      <DetailBlock
        title="Price levels"
        icon={<Target className="size-3.5 text-primary" />}
      >
        <DetailRow label="Entry" value={fmtPrice(e.entryPrice)} mono />
        {trendRs55 ? (
          <DetailRow label="Target / Stop" value="None — trend-flip exit" mono />
        ) : (
          <>
            <DetailRow label="Target" value={fmtPrice(e.targetPrice)} mono tone="good" />
            <DetailRow label="Stop" value={fmtPrice(e.stopPrice)} mono tone="bad" />
          </>
        )}
        <DetailRow label="ATR(14)" value={fmtPrice(e.atr14)} mono />
      </DetailBlock>

      {trendRs55 ? (
        <DetailBlock
          title="Setup"
          icon={<Activity className="size-3.5 text-primary" />}
        >
          <DetailRow
            label="Dist. 200 EMA"
            value={`${e.distanceFrom200Ema >= 0 ? "+" : ""}${e.distanceFrom200Ema.toFixed(2)}%`}
            tone={e.distanceFrom200Ema >= 0 ? "good" : "bad"}
          />
          <DetailRow
            label="Dist. 50 EMA"
            value={`${e.distanceTo50Ema >= 0 ? "+" : ""}${e.distanceTo50Ema.toFixed(2)}%`}
            tone={e.distanceTo50Ema >= 0 ? "good" : "bad"}
          />
          <DetailRow
            label="Market regime"
            value={e.niftyVs200Ema === "up" ? "Nifty above 200 EMA" : "Nifty below 200 EMA"}
            tone={e.niftyVs200Ema === "up" ? "good" : "bad"}
          />
        </DetailBlock>
      ) : (
        <DetailBlock
          title="Setup"
          icon={<Activity className="size-3.5 text-primary" />}
        >
          <DetailRow
            label="RSI(2)"
            value={e.rsi2.toFixed(2)}
            tone={e.rsi2 <= 10 ? "good" : "muted"}
          />
          <DetailRow
            label="Pullback depth"
            value={`${e.pullbackDepth.toFixed(2)}%`}
          />
          <DetailRow
            label="Dist. 200 EMA"
            value={`${e.distanceFrom200Ema >= 0 ? "+" : ""}${e.distanceFrom200Ema.toFixed(2)}%`}
            tone={e.distanceFrom200Ema >= 0 ? "good" : "bad"}
          />
          <DetailRow
            label="Candles from high"
            value={`${e.candlesFromHigh} / 20`}
          />
        </DetailBlock>
      )}

      <DetailBlock
        title="Position meta"
        icon={<ListChecks className="size-3.5 text-primary" />}
      >
        <DetailRow label="Entry date" value={fmtDate(e.entryDate)} />
        <DetailRow label="Holding days" value={`${holdingDays(e.entryDate)}d`} />
        <DetailRow label="Sector" value={e.sector || "—"} />
        <DetailRow label="Market cap" value={e.marketCapCategory || "—"} />
      </DetailBlock>

      {/* GTT action strip — no fixed levels to place a GTT for on a
          trend-flip-only exit, so this whole strip is rsi2-only */}
      {!trendRs55 && (
      <div className="col-span-12 flex flex-wrap items-center justify-between gap-3 text-[11px] text-muted-foreground border-t border-border/60 pt-4">
        <span>
          GTT ·{" "}
          <span className="text-primary tabular">{fmtPrice(e.targetPrice)}</span>{" "}
          target
          <span className="mx-2 text-border">·</span>
          <span className="text-destructive tabular">{fmtPrice(e.stopPrice)}</span>{" "}
          stop
        </span>
        <div className="flex items-center gap-2">
          <a href={KITE_GTT_URL} target="_blank" rel="noreferrer">
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 border-border/70"
            >
              <ExternalLink className="size-3.5" /> Open Kite
            </Button>
          </a>
          {t.gttPlaced ? (
            <Badge className="border h-7 px-2 gap-1.5 bg-primary/10 text-primary border-primary/30 hover:bg-primary/10">
              <CheckCircle2 className="size-3.5" /> GTT placed
            </Badge>
          ) : (
            <Button
              size="sm"
              className="h-8 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={setGtt.isPending}
              onClick={() => setGtt.mutate({ id: t.id, placed: true })}
            >
              <CheckCircle2 className="size-3.5" /> Mark placed
            </Button>
          )}
        </div>
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
    <div className="flex items-center justify-between text-sm">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={cn(
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
