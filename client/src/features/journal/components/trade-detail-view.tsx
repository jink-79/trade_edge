import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Gauge,
  ImageOff,
  Layers,
  LineChart,
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
import { cn } from "@/lib/utils";
import { usePreferences } from "@/features/preferences/hooks/use-preferences";
import {
  deriveEntryMetrics,
  deriveExitMetrics,
  fmtINR,
} from "../utils/journal-utils";
import { useJournalTrade } from "../hooks/use-journal";
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
  label: string;
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
      <div className="px-8 py-8 max-w-[1600px]">
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

  return (
    <div className="px-8 py-8 space-y-8 max-w-[1600px]">
      {/* HEADER */}
      <div className="space-y-4">
        <BackLink closed={isClosed} />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl grid place-items-center text-sm font-bold ring-1 ring-border/70 bg-[oklch(0.26_0.015_252)]">
              {e.ticker.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-3xl font-semibold tracking-tight">
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

      {/* SNAPSHOT STATS */}
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
              label="Realized P&L"
              value={`${exitMetrics.realizedPnl >= 0 ? "+" : "−"}${fmtINR(
                Math.abs(exitMetrics.realizedPnl),
              )}`}
              sub={signedPct(exitMetrics.realizedPnlPct)}
              tone={exitMetrics.realizedPnl >= 0 ? "good" : "bad"}
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
                  <span className="text-primary">{fmtINR(e.targetPrice)}</span>
                  <span className="text-muted-foreground"> / </span>
                  <span className="text-destructive">
                    {fmtINR(e.stopPrice)}
                  </span>
                </span>
              }
              sub={`Risk ${fmtINR(entryMetrics?.capitalAtRisk ?? 0)}`}
            />
            <Stat
              icon={Scale}
              label="Planned R:R"
              value={
                entryMetrics ? `${entryMetrics.plannedRR.toFixed(2)} : 1` : "—"
              }
              sub="reward ÷ risk"
              accent
            />
          </>
        )}
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* LEFT — charts + AI read */}
        <div className="xl:col-span-2 space-y-6">
          <SectionCard
            icon={LineChart}
            title="Charts"
            desc="Setup at entry and the exit snapshot."
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

          {(e.aiAnalysis || x?.aiAnalysis) && (
            <SectionCard
              icon={Sparkles}
              title="AI read"
              desc="Claude's notes captured with the chart."
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
                      At exit
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                      {x.aiAnalysis}
                    </p>
                  </div>
                )}
              </div>
            </SectionCard>
          )}

          {/* EXCURSION + EXIT OPTIMIZER */}
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

          {/* TECHNICAL INDICATORS */}
          <SectionCard
            icon={Activity}
            title="Technical indicators"
            desc="Measured at the entry candle."
          >
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
          </SectionCard>

          {/* RULE CHECKS */}
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
        </div>

        {/* RIGHT — execution + context */}
        <div className="space-y-6">
          <SectionCard icon={Ruler} title="Execution">
            <Row label="Direction" value={e.direction} />
            <Row label="Entry price" value={fmtINR(e.entryPrice)} />
            <Row label="Quantity" value={e.quantity} />
            <Row
              label="Target"
              value={fmtINR(e.targetPrice)}
              tone="good"
            />
            <Row label="Stop-loss" value={fmtINR(e.stopPrice)} tone="bad" />
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
                entryMetrics ? `${entryMetrics.plannedRR.toFixed(2)} : 1` : "—"
              }
            />
            <Row label="Entry date" value={fmtDateTime(e.entryDate)} />
          </SectionCard>

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
              <Row
                label="Realized P&L"
                value={`${exitMetrics.realizedPnl >= 0 ? "+" : "−"}${fmtINR(
                  Math.abs(exitMetrics.realizedPnl),
                )}`}
                tone={exitMetrics.realizedPnl >= 0 ? "good" : "bad"}
              />
              <Row
                label="Return"
                value={signedPct(exitMetrics.realizedPnlPct)}
                tone={exitMetrics.realizedPnlPct >= 0 ? "good" : "bad"}
              />
              <Row
                label="R multiple"
                value={
                  exitMetrics.rMultiple != null
                    ? `${exitMetrics.rMultiple >= 0 ? "+" : ""}${exitMetrics.rMultiple.toFixed(2)}R`
                    : "—"
                }
                tone={
                  exitMetrics.rMultiple != null
                    ? exitMetrics.rMultiple >= 0
                      ? "good"
                      : "bad"
                    : "default"
                }
              />
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
              {x.manualExitReason && (
                <div className="pt-3">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1">
                    Manual exit reason
                  </div>
                  <p className="text-sm text-foreground/90">
                    {x.manualExitReason}
                  </p>
                </div>
              )}
              <div className="pt-2">
                <Row label="Exit date" value={fmtDateTime(x.exitDate)} />
              </div>
            </SectionCard>
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

          {/* MARKET CONTEXT */}
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
            <Row label="Sector" value={e.sector || "—"} />
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
            <Row label="Candles available" value={e.candlesAvailable} />
            <Row
              label="Data quality"
              value={trade.dataQuality === "clean" ? "Clean" : "Excludable"}
              tone={trade.dataQuality === "clean" ? "good" : "muted"}
            />
          </SectionCard>

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
        </div>
      </div>
    </div>
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
