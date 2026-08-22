import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Gauge,
  ImageOff,
  Info,
  Layers,
  LineChart,
  Loader2,
  Ruler,
  Scale,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { usePreferences } from "@/features/preferences/hooks/use-preferences";
import {
  deriveEntryMetrics,
  deriveExitMetrics,
  fmtINR,
  fmtPrice,
  isTrendRs55,
} from "../utils/journal-utils";
import { useJournalTrade, useGenerateTradeInsight } from "../hooks/use-journal";
import { TradeChart } from "./trade-chart";
import { StockStrengthCard } from "./stock-strength-card";
import { TradeExcursionCard } from "./trade-excursion-card";
import { TradeExitOptimizer } from "./trade-exit-optimizer";
import { RuleAdherenceControl } from "./rule-adherence-control";
import type { JournalTrade } from "../types/journal.types";

const AMBER = "oklch(0.82 0.16 85)";

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const signedPct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;

const OUTCOME_STYLE: Record<string, string> = {
  TARGET: "bg-primary/10 text-primary border-primary/30",
  STOP: "bg-destructive/10 text-destructive border-destructive/30",
  "MANUAL-EXIT":
    "bg-[oklch(0.82_0.16_85/0.12)] text-[oklch(0.82_0.16_85)] border-[oklch(0.82_0.16_85/0.3)]",
  "STILL-OPEN": "bg-secondary/50 text-muted-foreground border-border/60",
};

/* ── small building blocks ─────────────────────────────────────────────── */

function Stat({
  icon: Icon,
  label,
  value,
  sub,
  tone = "default",
  accent = false,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: "default" | "good" | "bad";
  accent?: boolean;
}) {
  return (
    <Card
      className={cn(
        "border-border/70 bg-card/70",
        accent && "ring-1 ring-primary/30",
      )}
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription className="text-[11px] uppercase tracking-[0.16em]">
            {label}
          </CardDescription>
          <div className="size-7 rounded-md grid place-items-center ring-1 ring-border/70 bg-secondary/40">
            <Icon className="size-3.5 text-muted-foreground" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "text-2xl font-semibold tabular",
            tone === "good" && "text-primary",
            tone === "bad" && "text-destructive",
          )}
        >
          {value}
        </div>
        {sub ? (
          <div className="mt-0.5 text-xs text-muted-foreground tabular">
            {sub}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function SectionCard({
  icon: Icon,
  title,
  desc,
  right,
  children,
  className,
}: {
  icon: React.ElementType;
  title: string;
  desc?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={cn("border-border/70 bg-card/70", className)}
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Icon className="size-4 text-primary" /> {title}
          </CardTitle>
          {desc ? <CardDescription>{desc}</CardDescription> : null}
        </div>
        {right}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

/** Labelled value row inside a details card. */
function Row({
  label,
  value,
  tone = "default",
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  tone?: "default" | "good" | "bad" | "muted";
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={cn(
          "text-sm font-medium tabular text-right",
          tone === "good" && "text-primary",
          tone === "bad" && "text-destructive",
          tone === "muted" && "text-muted-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}

/** Indicator tile — a metric with an optional caption. */
function IndicatorTile({
  label,
  value,
  caption,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  caption?: string;
  tone?: "default" | "good" | "bad" | "warn";
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/40 px-4 py-3">
      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 text-lg font-semibold tabular",
          tone === "good" && "text-primary",
          tone === "bad" && "text-destructive",
          tone === "warn" && "text-[oklch(0.82_0.16_85)]",
        )}
      >
        {value}
      </div>
      {caption ? (
        <div className="text-[11px] text-muted-foreground mt-0.5">
          {caption}
        </div>
      ) : null}
    </div>
  );
}

/** Pass/fail pill for a boolean rule-check. */
function CheckPill({
  label,
  ok,
  goodWhenTrue = true,
}: {
  label: string;
  ok: boolean;
  goodWhenTrue?: boolean;
}) {
  const good = goodWhenTrue ? ok : !ok;
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
        good
          ? "border-primary/30 bg-primary/5 text-foreground"
          : "border-destructive/30 bg-destructive/5 text-foreground",
      )}
    >
      {good ? (
        <CheckCircle2 className="size-4 text-primary shrink-0" />
      ) : (
        <XCircle className="size-4 text-destructive shrink-0" />
      )}
      <span>{label}</span>
    </div>
  );
}

/** Chart screenshot with graceful empty state. */
function ChartShot({
  title,
  src,
  when,
}: {
  title: string;
  src?: string | null;
  when?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-[0.14em]">
          {title}
        </span>
        {when ? (
          <span className="text-[11px] text-muted-foreground tabular">
            {when}
          </span>
        ) : null}
      </div>
      {src ? (
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          className="block overflow-hidden rounded-xl border border-border/60"
        >
          <img
            src={src}
            alt={title}
            className="w-full object-contain bg-background/40 max-h-[440px]"
          />
        </a>
      ) : (
        <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 bg-background/30 text-muted-foreground">
          <ImageOff className="size-5" />
          <span className="text-xs">No chart captured</span>
        </div>
      )}
    </div>
  );
}

/* ── the view ──────────────────────────────────────────────────────────── */

interface TradeDetailViewProps {
  id: string | undefined;
}

export function TradeDetailView({ id }: TradeDetailViewProps) {
  const { data: trade, isLoading, isError } = useJournalTrade(id);
  const { data: prefs } = usePreferences();
  const capital = prefs?.defaultCapital ?? 100000;

  const entryMetrics = useMemo(() => {
    if (!trade) return null;
    return deriveEntryMetrics(
      {
        direction: trade.entry.direction,
        entryPrice: trade.entry.entryPrice,
        stopPrice: trade.entry.stopPrice,
        targetPrice: trade.entry.targetPrice,
        quantity: trade.entry.quantity,
        atr14: trade.entry.atr14,
      },
      capital,
    );
  }, [trade, capital]);

  const exitMetrics = useMemo(() => {
    if (!trade?.exit) return null;
    return deriveExitMetrics(trade.entry, {
      exitPrice: trade.exit.exitPrice,
      exitDate: trade.exit.exitDate,
    });
  }, [trade]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading trade…
      </div>
    );
  }

  if (isError || !trade) {
    return (
      <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-[1600px]">
        <BackLink />
        <div className="mt-8 rounded-xl border border-border/60 bg-card/60 py-20 text-center text-sm text-muted-foreground">
          Could not load this trade. It may have been removed.
        </div>
      </div>
    );
  }

  const e = trade.entry;
  const x = trade.exit;
  const isClosed = trade.outcome !== "STILL-OPEN" && !!x;
  const long = e.direction === "LONG";
  const trendRs55 = isTrendRs55(trade);
  // Net P&L when the backend computed it (charges-aware); falls back to the
  // gross figure for trades closed before charges tracking existed.
  const netPnl = x?.netPnlAmount ?? exitMetrics?.realizedPnl ?? 0;

  // Same six card "slots" whether the trade is open or closed — only the
  // data source changes (mark price vs exit price, unrealised vs net P&L,
  // running days-held vs final days-held), so the page reads the same way
  // regardless of trade state.
  const currentPrice = isClosed ? (x?.exitPrice ?? null) : (trade.markPrice ?? null);
  const sincePct = isClosed
    ? (exitMetrics?.realizedPnlPct ?? null)
    : trade.markPrice != null
      ? ((trade.markPrice - e.entryPrice) / e.entryPrice) * 100 * (long ? 1 : -1)
      : null;
  const pnlAmount = isClosed
    ? netPnl
    : trade.markPrice != null
      ? (long ? trade.markPrice - e.entryPrice : e.entryPrice - trade.markPrice) * e.quantity
      : null;
  const daysHeld =
    isClosed && exitMetrics
      ? exitMetrics.daysHeld
      : Math.max(0, Math.floor((Date.now() - new Date(e.entryDate).getTime()) / 86_400_000));

  return (
    <TooltipProvider>
    <div className="px-4 sm:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 max-w-[1600px]">
      {/* HEADER */}
      <div className="space-y-4">
        <BackLink closed={isClosed} />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="size-10 sm:size-12 rounded-2xl grid place-items-center text-sm font-bold ring-1 ring-border/70 bg-[oklch(0.26_0.015_252)] shrink-0">
              {e.ticker.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">
                  {e.ticker}
                </h1>
                <Badge
                  className={cn(
                    "border h-5 px-1.5 text-[10px]",
                    long
                      ? "bg-primary/10 text-primary border-primary/30"
                      : "bg-destructive/10 text-destructive border-destructive/30",
                  )}
                >
                  {long ? (
                    <TrendingUp className="size-2.5 mr-0.5" />
                  ) : (
                    <TrendingDown className="size-2.5 mr-0.5" />
                  )}
                  {e.direction}
                </Badge>
                {trade.source === "auto" && (
                  <Badge className="border h-5 px-1.5 text-[10px] bg-primary/10 text-primary border-primary/30">
                    AUTO
                  </Badge>
                )}
                {trade.dataQuality === "excludable" && (
                  <Badge className="border h-5 px-1.5 text-[10px] bg-[oklch(0.82_0.16_85/0.12)] text-[oklch(0.82_0.16_85)] border-[oklch(0.82_0.16_85/0.3)]">
                    Excludable
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Trade #{trade.tradeNumber} · {e.sector || "—"} ·{" "}
                {fmtDate(e.entryDate)}
                {isClosed && x ? ` → ${fmtDate(x.exitDate)}` : ""}
              </p>
            </div>
          </div>
          <Badge
            className={cn(
              "border h-7 px-3 text-xs",
              OUTCOME_STYLE[trade.outcome],
            )}
          >
            {trade.outcome}
          </Badge>
        </div>
      </div>

      {/* SNAPSHOT STATS — six cards, same slots whether the trade is open or
          closed (only the data source changes: mark vs exit price,
          unrealised vs net P&L, running vs final days-held), so the page
          reads the same way in either state. */}
      {trendRs55 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
          <Stat
            icon={Layers}
            label="Entry"
            value={fmtINR(e.entryPrice)}
            sub={`${e.quantity} qty`}
          />
          <Stat
            icon={Wallet}
            label="Deployed"
            value={fmtINR(entryMetrics?.capitalDeployed ?? 0)}
            sub={
              entryMetrics
                ? `${entryMetrics.positionSizePct.toFixed(1)}% of capital`
                : undefined
            }
          />
          <Stat
            icon={LineChart}
            label={isClosed ? "Exit price" : "Mark price"}
            value={currentPrice != null ? fmtINR(currentPrice) : "—"}
            sub={sincePct != null ? signedPct(sincePct) : "not priced yet"}
            tone={sincePct != null ? (sincePct >= 0 ? "good" : "bad") : "default"}
          />
          <Stat
            icon={TrendingUp}
            label={isClosed ? "Net P&L" : "Unrealised P&L"}
            value={
              pnlAmount != null
                ? `${pnlAmount >= 0 ? "+" : "−"}${fmtINR(Math.abs(pnlAmount))}`
                : "—"
            }
            sub={sincePct != null ? signedPct(sincePct) : undefined}
            tone={pnlAmount != null ? (pnlAmount >= 0 ? "good" : "bad") : "default"}
            accent
          />
          <Stat
            icon={Gauge}
            label="Days held"
            value={`${daysHeld}d`}
            sub={isClosed ? "entry → exit" : "since entry, still open"}
          />
          <Stat
            icon={Target}
            label="RS-55 at entry"
            value={e.rs55Pct != null ? `${e.rs55Pct.toFixed(2)}%` : "—"}
            sub="relative strength vs Nifty"
            tone="good"
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat
            icon={Layers}
            label="Entry"
            value={fmtINR(e.entryPrice)}
            sub={`${e.quantity} qty`}
          />
          <Stat
            icon={Wallet}
            label="Deployed"
            value={fmtINR(entryMetrics?.capitalDeployed ?? 0)}
            sub={
              entryMetrics
                ? `${entryMetrics.positionSizePct.toFixed(1)}% of capital`
                : undefined
            }
          />
          {isClosed && exitMetrics ? (
            <>
              <Stat
                icon={TrendingUp}
                label="Net P&L"
                value={`${netPnl >= 0 ? "+" : "−"}${fmtINR(Math.abs(netPnl))}`}
                sub={
                  entryMetrics && entryMetrics.capitalDeployed > 0
                    ? signedPct((netPnl / entryMetrics.capitalDeployed) * 100)
                    : signedPct(exitMetrics.realizedPnlPct)
                }
                tone={netPnl >= 0 ? "good" : "bad"}
                accent
              />
              <Stat
                icon={Gauge}
                label="R Multiple"
                value={
                  exitMetrics.rMultiple != null
                    ? `${exitMetrics.rMultiple >= 0 ? "+" : ""}${exitMetrics.rMultiple.toFixed(2)}R`
                    : "—"
                }
                sub={`${exitMetrics.daysHeld}d held`}
                tone={
                  exitMetrics.rMultiple != null
                    ? exitMetrics.rMultiple >= 0
                      ? "good"
                      : "bad"
                    : "default"
                }
              />
            </>
          ) : (
            <>
              <Stat
                icon={Target}
                label="Target / SL"
                value={
                  <span className="text-xl">
                    <span className="text-primary">{fmtPrice(e.targetPrice)}</span>
                    <span className="text-muted-foreground"> / </span>
                    <span className="text-destructive">
                      {fmtPrice(e.stopPrice)}
                    </span>
                  </span>
                }
                sub={`Risk ${fmtINR(entryMetrics?.capitalAtRisk ?? 0)}`}
              />
              <Stat
                icon={Scale}
                label="Planned R:R"
                value={
                  entryMetrics?.plannedRR != null
                    ? `${entryMetrics.plannedRR.toFixed(2)} : 1`
                    : "—"
                }
                sub="reward ÷ risk"
                accent
              />
            </>
          )}
        </div>
      )}

      {/* PRICE CHART — full width, not confined to the 2-col grid below */}
      <SectionCard
        icon={LineChart}
        title="Price chart"
        desc="~60 sessions before entry through exit (or today, if still open), with Mansfield RS (vs Nifty, EMA 55) below — phalanx-live's daily OHLCV."
      >
        <TradeChart id={trade.id} />
      </SectionCard>

      {/* SIGNAL ROW — the "is this good" section: technical strength (rule-
          based) and the AI review (closed trades only), given top billing
          right under the chart since that's what actually gets checked
          first. A single item stretches full width via flex-1 instead of
          leaving an empty grid track when only one of the two applies. */}
      {(trendRs55 || isClosed) && (
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {trendRs55 && (
            <div className="w-full flex-1 min-w-0">
              <StockStrengthCard id={trade.id} />
            </div>
          )}
          {isClosed && (
            <div className="w-full flex-1 min-w-0">
              <TradeReviewCard trade={trade} />
            </div>
          )}
        </div>
      )}

      {/* DETAILS — everything else, tabbed so the page reads as sections
          instead of one long stack. Short labels + a 2-col grid on phones
          keep the tab bar itself from needing horizontal scroll. */}
      <Tabs defaultValue="execution">
        <TabsList className="grid grid-cols-2 sm:flex sm:w-fit w-full gap-1 h-auto sm:h-8 p-1">
          <TabsTrigger value="execution" className="gap-1.5">
            <Ruler className="size-3.5" /> Execution
          </TabsTrigger>
          <TabsTrigger value="indicators" className="gap-1.5">
            <Activity className="size-3.5" /> Indicators
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5">
            <BarChart3 className="size-3.5" /> Analytics
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-1.5">
            <Sparkles className="size-3.5" /> Notes
          </TabsTrigger>
        </TabsList>

        {/* EXECUTION */}
        <TabsContent value="execution" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <SectionCard icon={Ruler} title="Execution">
              <Row label="Direction" value={e.direction} />
              <Row label="Entry price" value={fmtINR(e.entryPrice)} />
              <Row label="Quantity" value={e.quantity} />
              {trendRs55 ? (
                <>
                  <Row
                    label="RS-55 at entry"
                    value={e.rs55Pct != null ? `${e.rs55Pct.toFixed(2)}%` : "—"}
                    tone="good"
                  />
                  <Row label="Exit rule" value="Trend flip (no fixed stop/target)" />
                  <Row
                    label="Capital deployed"
                    value={fmtINR(entryMetrics?.capitalDeployed ?? 0)}
                  />
                  <Row label="Sector" value={e.sector || "—"} />
                  <Row label="Market cap" value={e.marketCapCategory || "—"} />
                </>
              ) : (
                <>
                  <Row label="Target" value={fmtPrice(e.targetPrice)} tone="good" />
                  <Row label="Stop-loss" value={fmtPrice(e.stopPrice)} tone="bad" />
                  <Row
                    label="Capital deployed"
                    value={fmtINR(entryMetrics?.capitalDeployed ?? 0)}
                  />
                  <Row
                    label="Capital at risk"
                    value={fmtINR(entryMetrics?.capitalAtRisk ?? 0)}
                    tone="bad"
                  />
                  <Row
                    label="Reward / share"
                    value={fmtINR(entryMetrics?.rewardPerShare ?? 0)}
                    tone="good"
                  />
                  <Row
                    label="Planned R:R"
                    value={
                      entryMetrics?.plannedRR != null
                        ? `${entryMetrics.plannedRR.toFixed(2)} : 1`
                        : "—"
                    }
                  />
                </>
              )}
              <Row label="Entry date" value={fmtDateTime(e.entryDate)} />
            </SectionCard>

            <div className="space-y-6">
              <RuleAdherenceControl trade={trade} />

              {isClosed && x && exitMetrics ? (
                <SectionCard
                  icon={BarChart3}
                  title="Exit"
                  right={
                    <Badge
                      className={cn(
                        "border h-5 px-1.5 text-[10px]",
                        OUTCOME_STYLE[trade.outcome],
                      )}
                    >
                      {trade.outcome}
                    </Badge>
                  }
                >
                  <Row label="Exit price" value={fmtINR(x.exitPrice)} />
                  {x.quantity != null && x.quantity !== e.quantity && (
                    <Row label="Exited qty" value={`${x.quantity} of ${e.quantity}`} />
                  )}
                  <Row
                    label="Gross P&L"
                    value={`${exitMetrics.realizedPnl >= 0 ? "+" : "−"}${fmtINR(
                      Math.abs(exitMetrics.realizedPnl),
                    )}`}
                    tone={exitMetrics.realizedPnl >= 0 ? "good" : "bad"}
                  />
                  <Row
                    label="Charges"
                    value={x.charges ? `−${fmtINR(x.charges.totalCharges)}` : "—"}
                    tone="muted"
                  />
                  <Row
                    label="Net P&L"
                    value={`${netPnl >= 0 ? "+" : "−"}${fmtINR(Math.abs(netPnl))}`}
                    tone={netPnl >= 0 ? "good" : "bad"}
                  />
                  <Row
                    label="Return"
                    value={signedPct(exitMetrics.realizedPnlPct)}
                    tone={exitMetrics.realizedPnlPct >= 0 ? "good" : "bad"}
                  />
                  {exitMetrics.rMultiple != null && (
                    <Row
                      label={
                        exitMetrics.rMultipleBasis === "atr" ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center gap-1 cursor-help underline decoration-dotted underline-offset-2">
                                R multiple (vs ATR) <Info className="size-3" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[260px] text-left">
                              No stop-loss on this trade, so R is measured against
                              ATR(14) at entry (the stock's typical daily swing)
                              instead of a real risk distance — not the standard
                              R-multiple calculation.
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          "R multiple"
                        )
                      }
                      value={`${exitMetrics.rMultiple >= 0 ? "+" : ""}${exitMetrics.rMultiple.toFixed(2)}R`}
                      tone={exitMetrics.rMultiple >= 0 ? "good" : "bad"}
                    />
                  )}
                  <Row label="Days held" value={`${exitMetrics.daysHeld}d`} />
                  {x.maxAdverseExcursion != null && (
                    <Row
                      label="Max adverse excursion"
                      value={`${x.maxAdverseExcursion.toFixed(2)}%`}
                      tone="bad"
                    />
                  )}
                  {x.stopWickedThenRecovered != null && (
                    <Row
                      label="Stop wicked, recovered"
                      value={x.stopWickedThenRecovered ? "Yes" : "No"}
                      tone="muted"
                    />
                  )}
                  {x.targetTaggedThenReversed != null && (
                    <Row
                      label="Target tagged, reversed"
                      value={x.targetTaggedThenReversed ? "Yes" : "No"}
                      tone="muted"
                    />
                  )}
                  <div className="pt-2">
                    <Row label="Exit date" value={fmtDateTime(x.exitDate)} />
                  </div>

                  {x.charges && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-2">
                        Charges breakdown
                      </div>
                      <Row label="STT" value={fmtPrice(x.charges.stt)} />
                      <Row label="Exchange" value={fmtPrice(x.charges.exchangeCharges)} />
                      <Row label="SEBI" value={fmtPrice(x.charges.sebiCharges)} />
                      <Row label="Stamp duty" value={fmtPrice(x.charges.stampDuty)} />
                      <Row label="DP" value={fmtPrice(x.charges.dpCharges)} />
                      <Row label="GST" value={fmtPrice(x.charges.gst)} />
                    </div>
                  )}
                </SectionCard>
              ) : trendRs55 ? (
                <Card
                  className="border-[oklch(0.82_0.16_85/0.35)] bg-card/70"
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <ShieldAlert className="size-4" style={{ color: AMBER }} /> Position
                      open
                    </CardTitle>
                    <CardDescription>
                      {trade.markDate
                        ? `Prices as of ${fmtDate(trade.markDate)} close`
                        : "Not priced yet"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Row label="Mark price" value={fmtPrice(trade.markPrice)} />
                    {trade.markPrice != null && (
                      <Row
                        label="Since entry"
                        value={signedPct(
                          ((trade.markPrice - e.entryPrice) / e.entryPrice) * 100,
                        )}
                        tone={trade.markPrice >= e.entryPrice ? "good" : "bad"}
                      />
                    )}
                    {trade.markPrice != null && trade.markPrevClose != null && (
                      <Row
                        label="Today"
                        value={signedPct(
                          ((trade.markPrice - trade.markPrevClose) / trade.markPrevClose) * 100,
                        )}
                        tone={trade.markPrice >= trade.markPrevClose ? "good" : "bad"}
                      />
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card
                  className="border-[oklch(0.82_0.16_85/0.35)] bg-card/70"
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <ShieldAlert
                        className="size-4"
                        style={{ color: AMBER }}
                      />{" "}
                      Position open
                    </CardTitle>
                    <CardDescription>
                      This trade is still live. Exit metrics appear here once it
                      closes.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Row
                      label="GTT placed"
                      value={trade.gttPlaced ? "Yes" : "No"}
                      tone={trade.gttPlaced ? "good" : "muted"}
                    />
                    <Row
                      label="Needs review"
                      value={trade.needsReview ? "Yes" : "No"}
                      tone={trade.needsReview ? "muted" : "good"}
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* INDICATORS */}
        <TabsContent value="indicators" className="mt-6 space-y-6">
          <SectionCard
            icon={Activity}
            title="Technical indicators"
            desc="Measured at the entry candle."
          >
            {trendRs55 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <IndicatorTile
                  label="RS-55 at entry"
                  value={e.rs55Pct != null ? `${e.rs55Pct.toFixed(2)}%` : "—"}
                  caption="vs Nifty, 55 sessions"
                  tone="good"
                />
                <IndicatorTile
                  label="ATR(14)"
                  value={fmtINR(e.atr14)}
                  caption={
                    entryMetrics
                      ? `${entryMetrics.atrPctOfEntry.toFixed(2)}% of price`
                      : undefined
                  }
                />
                <IndicatorTile
                  label="Dist. 200 EMA"
                  value={signedPct(e.distanceFrom200Ema)}
                  caption="close vs 200 EMA"
                  tone={e.distanceFrom200Ema >= 0 ? "good" : "bad"}
                />
                <IndicatorTile
                  label="Dist. 50 EMA"
                  value={signedPct(e.distanceTo50Ema)}
                  caption="entry vs 50 EMA"
                  tone={e.distanceTo50Ema >= 0 ? "good" : "bad"}
                />
                <IndicatorTile
                  label="Market regime"
                  value={e.niftyVs200Ema === "up" ? "Nifty up-trend" : "Nifty down-trend"}
                  caption="on the entry date"
                  tone={e.niftyVs200Ema === "up" ? "good" : "bad"}
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <IndicatorTile
                  label="RSI(2)"
                  value={e.rsi2.toFixed(2)}
                  caption={e.rsi2 <= 10 ? "oversold" : "elevated"}
                  tone={e.rsi2 <= 10 ? "good" : "warn"}
                />
                <IndicatorTile
                  label="ATR(14)"
                  value={fmtINR(e.atr14)}
                  caption={
                    entryMetrics
                      ? `${entryMetrics.atrPctOfEntry.toFixed(2)}% of price`
                      : undefined
                  }
                />
                <IndicatorTile
                  label="Dist. 200 EMA"
                  value={signedPct(e.distanceFrom200Ema)}
                  caption="close vs 200 EMA"
                  tone={e.distanceFrom200Ema >= 0 ? "good" : "bad"}
                />
                <IndicatorTile
                  label="Dist. 50 EMA"
                  value={signedPct(e.distanceTo50Ema)}
                  caption="entry vs 50 EMA"
                />
                <IndicatorTile
                  label="Pullback depth"
                  value={`${e.pullbackDepth.toFixed(2)}%`}
                  caption="from recent high"
                />
                <IndicatorTile
                  label="Candles from high"
                  value={`${e.candlesFromHigh} / 20`}
                  caption="bars since high"
                />
                <IndicatorTile
                  label="Entry candle close"
                  value={labelClose(e.entryCandleClose)}
                  caption="within its range"
                />
                <IndicatorTile
                  label="Down-move volume"
                  value={labelVolume(e.downMoveVolume)}
                  caption="into the entry"
                />
                <IndicatorTile
                  label="Price floor"
                  value={e.priceAbove200 ? "Above ₹200" : "Below ₹200"}
                  tone={e.priceAbove200 ? "good" : "bad"}
                />
              </div>
            )}
          </SectionCard>

          {/* RULE CHECKS — the RSI-2 strategy's discretionary entry checklist,
              not applicable to systematic trend-flip trades */}
          {!trendRs55 && (
            <SectionCard
              icon={CheckCircle2}
              title="Rule checks"
              desc="The four Tier-1 conditions for a valid setup."
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <CheckPill label="Price above 200 EMA" ok={e.priceAbove200} />
                <CheckPill
                  label={`RSI(2) oversold (${e.rsi2.toFixed(2)})`}
                  ok={e.rsi2 <= 10}
                />
                <CheckPill
                  label={`Near recent high (${e.candlesFromHigh}/20 bars)`}
                  ok={e.candlesFromHigh <= 20}
                />
                <CheckPill
                  label={`Above 200 EMA by ${signedPct(e.distanceFrom200Ema)}`}
                  ok={e.distanceFrom200Ema >= 0}
                />
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <CheckPill
                  label="Target sits under resistance"
                  ok={e.targetUnderResistance}
                />
                <CheckPill label="Stop has support below" ok={e.stopHasSupport} />
              </div>
            </SectionCard>
          )}

          <SectionCard
            icon={CalendarDays}
            title="Market context"
            desc="Regime & structure on the entry date."
          >
            <Row
              label="Nifty vs 200 EMA"
              value={e.niftyVs200Ema === "up" ? "Up-trend" : "Down-trend"}
              tone={e.niftyVs200Ema === "up" ? "good" : "bad"}
            />
            <Row label="Nifty RSI(2)" value={e.niftyRsi2.toFixed(2)} />
            {!trendRs55 && <Row label="Sector" value={e.sector || "—"} />}
            {!trendRs55 && (
              <>
                <Row
                  label="Gapped into entry"
                  value={e.gappedIntoEntry ? "Yes" : "No"}
                  tone={e.gappedIntoEntry ? "muted" : "good"}
                />
                <Row
                  label="Event within window"
                  value={e.eventWithinWindow ? "Yes" : "No"}
                  tone={e.eventWithinWindow ? "bad" : "good"}
                />
              </>
            )}
            <Row label="Candles available" value={e.candlesAvailable} />
            <Row
              label="Data quality"
              value={trade.dataQuality === "clean" ? "Clean" : "Excludable"}
              tone={trade.dataQuality === "clean" ? "good" : "muted"}
            />
          </SectionCard>
        </TabsContent>

        {/* ANALYTICS */}
        <TabsContent value="analytics" className="mt-6 space-y-6">
          {trade.analytics ? (
            <>
              <TradeExcursionCard analytics={trade.analytics} />
              <TradeExitOptimizer analytics={trade.analytics} />
            </>
          ) : (
            <SectionCard
              icon={Sparkles}
              title="Trade analytics"
              desc="MAE/MFE and the exit optimizer."
            >
              <p className="text-sm text-muted-foreground">
                Not analyzed yet. The nightly enrich job (or a manual run)
                measures how far this trade ran for/against you and replays
                alternative exit rules from its candles.
              </p>
            </SectionCard>
          )}
        </TabsContent>

        {/* NOTES & MEDIA */}
        <TabsContent value="notes" className="mt-6 space-y-6">
          {(e.screenshot || x?.screenshot) && (
            <SectionCard
              icon={ImageOff}
              title="Captured screenshots"
              desc="Manually attached at entry/exit review."
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <ChartShot
                  title="Entry chart"
                  src={e.screenshot}
                  when={fmtDate(e.entryDate)}
                />
                <ChartShot
                  title="Exit chart"
                  src={x?.screenshot}
                  when={x ? fmtDate(x.exitDate) : undefined}
                />
              </div>
            </SectionCard>
          )}

          {(e.aiAnalysis || x?.aiAnalysis) && (
            <SectionCard
              icon={Sparkles}
              title="AI notes"
              desc="Entry-time chart read and/or the auto-generated exit summary."
            >
              <div className="space-y-4">
                {e.aiAnalysis && (
                  <div className="rounded-xl border border-border/60 bg-background/40 p-4">
                    <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5">
                      At entry
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                      {e.aiAnalysis}
                    </p>
                  </div>
                )}
                {x?.aiAnalysis && (
                  <div className="rounded-xl border border-border/60 bg-background/40 p-4">
                    <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5">
                      Exit summary
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                      {x.aiAnalysis}
                    </p>
                  </div>
                )}
              </div>
            </SectionCard>
          )}

          {(e.notes || trade.dataQualityNote) && (
            <SectionCard icon={Sparkles} title="Notes">
              {e.notes && (
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                  {e.notes}
                </p>
              )}
              {trade.dataQualityNote && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Data-quality note: {trade.dataQualityNote}
                </p>
              )}
            </SectionCard>
          )}

          {!e.screenshot && !x?.screenshot && !e.aiAnalysis && !x?.aiAnalysis && !e.notes && !trade.dataQualityNote && (
            <div className="rounded-xl border border-dashed border-border/60 bg-card/40 py-12 text-center text-sm text-muted-foreground">
              No screenshots or notes attached to this trade yet.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
    </TooltipProvider>
  );
}

/* ── AI trade review (closed trades) ──────────────────────────────────── */

function AdherenceBadge({ label, tone }: { label: string; tone: "good" | "bad" | "muted" }) {
  return (
    <Badge
      className={cn(
        "border h-6 px-2 text-[11px] hover:bg-transparent",
        tone === "good" && "bg-primary/10 text-primary border-primary/30",
        tone === "bad" && "bg-destructive/10 text-destructive border-destructive/30",
        tone === "muted" && "bg-secondary/50 text-muted-foreground border-border/60",
      )}
    >
      {label}
    </Badge>
  );
}

function entryAdherenceBadge(check: NonNullable<JournalTrade["tradeInsight"]>["entryCheck"]) {
  if (!check.signalFound) return <AdherenceBadge label="Entry: unverified" tone="muted" />;
  if (check.inToBuy) return <AdherenceBadge label="Entry: system-aligned" tone="good" />;
  if (check.inCandidates) return <AdherenceBadge label="Entry: ranked, not sized" tone="bad" />;
  return <AdherenceBadge label="Entry: discretionary" tone="bad" />;
}

function exitAdherenceBadge(check: NonNullable<JournalTrade["tradeInsight"]>["exitCheck"]) {
  if (!check.signalFound) return <AdherenceBadge label="Exit: unverified" tone="muted" />;
  if (check.inExits) return <AdherenceBadge label="Exit: system-aligned" tone="good" />;
  return <AdherenceBadge label="Exit: discretionary" tone="bad" />;
}

function TradeReviewCard({ trade }: { trade: JournalTrade }) {
  const insightMut = useGenerateTradeInsight();
  const insight = trade.tradeInsight;

  return (
    <SectionCard
      icon={ClipboardCheck}
      title="Trade review"
      desc="AI review against the strategy's own rules, verified against phalanx-live's daily scan."
      right={
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 text-xs"
          disabled={insightMut.isPending}
          onClick={() => insightMut.mutate(trade.id)}
        >
          {insightMut.isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Sparkles className="size-3.5" />
          )}
          {insight ? "Regenerate" : "Generate"}
        </Button>
      }
    >
      {insightMut.isPending ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
          <Loader2 className="size-4 animate-spin" /> Reviewing this trade…
        </div>
      ) : insight ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {entryAdherenceBadge(insight.entryCheck)}
            {exitAdherenceBadge(insight.exitCheck)}
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
            {insight.text}
          </p>
          <div className="text-[11px] text-muted-foreground">
            Generated {fmtDateTime(insight.generatedAt)}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Not reviewed yet — click Generate for a comprehensive read on whether this
          trade's entry and exit actually matched the system's own rules, and what
          could have gone better.
        </p>
      )}
    </SectionCard>
  );
}

/* ── helpers ───────────────────────────────────────────────────────────── */

function BackLink({ closed }: { closed?: boolean }) {
  const to = closed ? "/history" : "/positions";
  const label = closed ? "Back to Trade History" : "Back to Open Positions";
  return (
    <Link to={to}>
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2"
      >
        <ArrowLeft className="size-4" /> {label}
      </Button>
    </Link>
  );
}

function labelClose(c: JournalTrade["entry"]["entryCandleClose"]): string {
  const map: Record<string, string> = {
    "at-low": "At low",
    "lower-third": "Lower ⅓",
    mid: "Mid",
    "upper-third": "Upper ⅓",
    "at-high": "At high",
  };
  return map[c] ?? c;
}

function labelVolume(v: JournalTrade["entry"]["downMoveVolume"]): string {
  const map: Record<string, string> = {
    climactic: "Climactic",
    "above-average": "Above avg",
    average: "Average",
    quiet: "Quiet",
  };
  return map[v] ?? v;
}
