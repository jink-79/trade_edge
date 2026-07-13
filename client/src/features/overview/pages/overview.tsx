// import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Sparkles,
  Brain,
  ShieldCheck,
  AlertTriangle,
  Layers,
  Target,
  RefreshCw,
  Copy,
  Download,
  CheckCircle2,
  CircleDot,
  XCircle,
  CalendarRange,
  Gauge,
  Lightbulb,
  ArrowUpRight,
  ArrowDownRight,
  Flag,
} from "lucide-react";
import { cn } from "@/lib/utils";
// import { Topbar } from "@/components/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

// export const Route = createFileRoute("/overview")({
//   head: () => ({
//     meta: [
//       { title: "Weekly AI Review · Trade Edge" },
//       {
//         name: "description",
//         content:
//           "AI-powered weekly review of open positions and new entries — a concise read on portfolio health, momentum and risk.",
//       },
//     ],
//   }),
//   component: OverviewPage,
// });

type Verdict = "Strong Hold" | "Hold" | "Trim" | "Watch" | "Exit";

const verdictStyle: Record<Verdict, string> = {
  "Strong Hold": "text-success border-success/30 bg-success/10",
  Hold: "text-primary border-primary/30 bg-primary/10",
  Trim: "text-warning border-warning/30 bg-warning/10",
  Watch: "text-muted-foreground border-border bg-secondary/40",
  Exit: "text-destructive border-destructive/30 bg-destructive/10",
};

type Insight = {
  id: string;
  title: string;
  body: string;
  tone: "positive" | "negative" | "neutral" | "warning";
};

const insights: Insight[] = [
  {
    id: "i1",
    title: "Portfolio leans firmly toward IT & EMS leaders",
    body: "62% of deployed capital sits in IT services and electronics manufacturing names that are still trading above 20-week EMAs. Concentration is high but the trend regime is supportive — no urgent need to dilute the thesis.",
    tone: "positive",
  },
  {
    id: "i2",
    title: "TATAELXSI is the weakest open trade",
    body: "Price is trading -0.74% below the highest close since entry and only 3% above the structure low at ₹3,945. Risk:reward has compressed. Tighten the trailing stop or scale 25% off if next candle closes red.",
    tone: "warning",
  },
  {
    id: "i3",
    title: "RELIANCE: textbook trend continuation",
    body: "Higher highs and higher lows on the weekly. Volume profile confirms accumulation. No action needed — let the trailing stop do the work.",
    tone: "positive",
  },
  {
    id: "i4",
    title: "New entry INFY is early but valid",
    body: "Entered on a stage-2 breakout from a 9-week base. Position is 0.8R in profit. Avoid pyramiding until weekly close confirms above ₹1,920.",
    tone: "neutral",
  },
  {
    id: "i5",
    title: "HDFCBANK looks heavy",
    body: "Three consecutive distribution days against the broader Nifty. If next session closes below ₹1,640, the structure low gives way — pre-plan the exit.",
    tone: "negative",
  },
  {
    id: "i6",
    title: "Capital deployment at 84% is on the high end",
    body: "Free cash is ~₹1.2L. Reserve at least one full slot for a reactive entry if Nifty pulls back to its rising 20-DMA next week.",
    tone: "warning",
  },
  {
    id: "i7",
    title: "Win rate this week tracks above your 12-week average",
    body: "5 of 6 open trades are in profit (+83% vs 71% baseline). Expectancy stays positive even if HDFCBANK is stopped.",
    tone: "positive",
  },
  {
    id: "i8",
    title: "Average holding period is healthy",
    body: "Mean of 21 trading days — longer than your historical 14 — suggests trades are being given room to trend, which aligns with the playbook.",
    tone: "positive",
  },
  {
    id: "i9",
    title: "Sector skew: missing Pharma & PSU Banks",
    body: "Both groups are in stage-2 advances and you have zero exposure. Consider a screen for breakout candidates over the weekend.",
    tone: "neutral",
  },
  {
    id: "i10",
    title: "Trailing-stop hygiene needs work",
    body: "2 of 6 positions still show TSL as ‘--’. Defining a stop on every position is non-negotiable for the system to compound.",
    tone: "warning",
  },
  {
    id: "i11",
    title: "BHARTIARTL is the quiet winner",
    body: "Lowest drawdown from peak (-0.3%) of the cohort. A great example of a low-noise trend — let it ride.",
    tone: "positive",
  },
  {
    id: "i12",
    title: "Macro check: India VIX is contracting",
    body: "VIX is at a 6-week low, which favours trend-following setups. Stay aggressive on new breakouts that meet the checklist.",
    tone: "positive",
  },
  {
    id: "i13",
    title: "Position sizing is consistent",
    body: "Per-trade risk is 0.9R–1.1R across all 6 positions. Discipline is good — keep new entries within the same band.",
    tone: "positive",
  },
  {
    id: "i14",
    title: "Watch for FII flow reversal",
    body: "FII have been net sellers in 3 of the last 5 sessions. If selling persists into next week, expect more whipsaws on intraday breakouts.",
    tone: "warning",
  },
  {
    id: "i15",
    title: "Next week's playbook",
    body: "1) Tighten TATAELXSI stop. 2) Define HDFCBANK exit trigger. 3) Add TSL to remaining two positions. 4) Screen Pharma/PSU Bank breakouts. 5) Keep one slot in cash.",
    tone: "neutral",
  },
];

type Verdicted = {
  symbol: string;
  name: string;
  type: "Open" | "New";
  verdict: Verdict;
  rationale: string;
  rr: string;
  change: number;
};

const positionVerdicts: Verdicted[] = [
  {
    symbol: "TATAELXSI",
    name: "Tata Elxsi",
    type: "Open",
    verdict: "Trim",
    rationale: "Momentum fading near structure low. Reduce 25% on weakness.",
    rr: "0.4R",
    change: -0.74,
  },
  {
    symbol: "RELIANCE",
    name: "Reliance Industries",
    type: "Open",
    verdict: "Strong Hold",
    rationale: "Trend intact. Higher highs on weekly.",
    rr: "2.8R",
    change: 1.42,
  },
  {
    symbol: "HDFCBANK",
    name: "HDFC Bank",
    type: "Open",
    verdict: "Exit",
    rationale: "Distribution days stacking. Plan exit on close < ₹1,640.",
    rr: "-0.6R",
    change: -1.18,
  },
  {
    symbol: "INFY",
    name: "Infosys",
    type: "New",
    verdict: "Hold",
    rationale: "Stage-2 breakout. Avoid pyramiding until ₹1,920.",
    rr: "0.8R",
    change: 0.92,
  },
  {
    symbol: "ICICIBANK",
    name: "ICICI Bank",
    type: "Open",
    verdict: "Hold",
    rationale: "Slow grind higher. Move stop to breakeven.",
    rr: "1.6R",
    change: 0.55,
  },
  {
    symbol: "BHARTIARTL",
    name: "Bharti Airtel",
    type: "Open",
    verdict: "Strong Hold",
    rationale: "Cleanest trend in the book. Trail loosely.",
    rr: "2.1R",
    change: 0.81,
  },
];

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  tone?: "pos" | "neg" | "accent" | "warn";
}) {
  return (
    <Card className="relative overflow-hidden border-border/60 bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            {label}
          </p>
          <div className="rounded-md bg-secondary/60 p-1.5">
            <Icon className="h-3.5 w-3.5" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p
          className={cn(
            "font-mono text-2xl font-semibold tracking-tight tabular-nums",
            tone === "pos" && "text-success",
            tone === "neg" && "text-destructive",
            tone === "accent" && "text-primary",
            tone === "warn" && "text-warning",
          )}
        >
          {value}
        </p>
        {sub && <p className="mt-1 text-[11px] text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function toneStyles(tone: Insight["tone"]) {
  switch (tone) {
    case "positive":
      return {
        ring: "ring-success/20",
        dot: "bg-success",
        icon: CheckCircle2,
        color: "text-success",
      };
    case "negative":
      return {
        ring: "ring-destructive/20",
        dot: "bg-destructive",
        icon: XCircle,
        color: "text-destructive",
      };
    case "warning":
      return {
        ring: "ring-warning/20",
        dot: "bg-warning",
        icon: AlertTriangle,
        color: "text-warning",
      };
    default:
      return {
        ring: "ring-border",
        dot: "bg-muted-foreground",
        icon: CircleDot,
        color: "text-muted-foreground",
      };
  }
}

export function OverviewPage() {
  const [generating, setGenerating] = useState(false);

  const regenerate = () => {
    setGenerating(true);
    setTimeout(() => setGenerating(false), 1400);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* <Topbar /> */}

      <main className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        {/* Page header */}
        <div className="flex flex-col gap-4 border-b border-border/60 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-widest text-primary">
                <Sparkles className="h-3 w-3" /> AI Weekly Review
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-secondary/60 px-2.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                <CalendarRange className="h-3 w-3" /> Wk 25 · 16 Jun – 22 Jun
                2026
              </span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">
              Overview & AI Review
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              An AI-generated read on your{" "}
              <span className="text-foreground">6 open positions</span> and{" "}
              <span className="text-foreground">1 new entry</span> from this
              week. Use it as a second pair of eyes — not a trade trigger.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Copy className="h-3.5 w-3.5" /> Copy
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-3.5 w-3.5" /> Export PDF
            </Button>
            <Button onClick={regenerate} size="sm" className="gap-2">
              <RefreshCw
                className={cn("h-3.5 w-3.5", generating && "animate-spin")}
              />
              {generating ? "Generating…" : "Regenerate"}
            </Button>
          </div>
        </div>

        {/* KPI cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            icon={Layers}
            label="Positions Reviewed"
            value="6"
            sub="5 open · 1 new this week"
          />
          <KpiCard
            icon={Gauge}
            label="Portfolio Health"
            value="74 / 100"
            sub="Above 12-wk avg of 68"
            tone="accent"
          />
          <KpiCard
            icon={Brain}
            label="AI Confidence"
            value="High"
            sub="Based on 18 signals"
            tone="pos"
          />
          <KpiCard
            icon={Flag}
            label="Overall Stance"
            value="Constructive"
            sub="Trim 1 · Exit 1 · Hold 4"
            tone="pos"
          />
        </div>

        {/* Stance distribution */}
        <div className="mt-4 grid gap-4 lg:grid-cols-5">
          <Card className="border-border/60 bg-card lg:col-span-3">
            <CardHeader className="pb-2">
              <p className="font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Stance Distribution
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex h-3 overflow-hidden rounded-full bg-secondary/60">
                <div className="h-full bg-success" style={{ width: "33%" }} />
                <div className="h-full bg-primary" style={{ width: "34%" }} />
                <div className="h-full bg-warning" style={{ width: "17%" }} />
                <div
                  className="h-full bg-destructive"
                  style={{ width: "16%" }}
                />
              </div>
              <div className="mt-3 grid grid-cols-4 gap-3 font-mono text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-success" />
                  <span className="text-muted-foreground">Strong Hold</span>
                  <span className="ml-auto text-foreground">2</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-muted-foreground">Hold</span>
                  <span className="ml-auto text-foreground">2</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-warning" />
                  <span className="text-muted-foreground">Trim</span>
                  <span className="ml-auto text-foreground">1</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-destructive" />
                  <span className="text-muted-foreground">Exit</span>
                  <span className="ml-auto text-foreground">1</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-card lg:col-span-2">
            <CardHeader className="pb-2">
              <p className="font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                This Week At A Glance
              </p>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <p className="font-mono text-lg font-semibold tabular-nums text-success">
                  +2.4%
                </p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Book P&L
                </p>
              </div>
              <div>
                <p className="font-mono text-lg font-semibold tabular-nums">
                  84%
                </p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Deployed
                </p>
              </div>
              <div>
                <p className="font-mono text-lg font-semibold tabular-nums">
                  5 / 6
                </p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  In Profit
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Executive summary */}
        <Card className="relative mt-6 overflow-hidden border-border/60 bg-card">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
          <CardHeader className="relative pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-md bg-primary/10 p-1.5 ring-1 ring-primary/20">
                  <Brain className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Executive Summary</p>
                  <p className="text-[11px] text-muted-foreground">
                    Generated by Gemini · synthesised from 6 positions & weekly
                    price action
                  </p>
                </div>
              </div>
              <span className="hidden font-mono text-[10px] text-muted-foreground sm:block">
                ~ 220 words · 1 min read
              </span>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <p className="text-sm leading-relaxed text-foreground/90">
              Your book is in a{" "}
              <span className="font-medium text-success">
                constructive trend regime
              </span>{" "}
              with five of six positions in profit and average open R-multiple
              of <span className="font-mono">+1.5R</span>. The dominant theme is
              IT and electronics manufacturing — both groups remain above their
              20-week moving averages and continue to lead the broader market.
              The standout winners are{" "}
              <span className="font-medium">RELIANCE</span> and{" "}
              <span className="font-medium">BHARTIARTL</span>, which are
              exhibiting low-volatility trend behaviour and need no
              intervention.{" "}
              <span className="font-medium text-warning">TATAELXSI</span> is the
              weakest link — momentum has faded and price is sitting close to
              its structure low at ₹3,945. A defined trim or stop tightening is
              appropriate before next week's open.{" "}
              <span className="font-medium text-destructive">HDFCBANK</span>{" "}
              shows three distribution days against the index; pre-plan the exit
              on a close below ₹1,640. The lone new entry,{" "}
              <span className="font-medium">INFY</span>, is a clean stage-2
              breakout — keep size as planned and avoid pyramiding until ₹1,920
              confirms on a weekly close. Overall capital deployment of 84% is
              on the higher end; preserving at least one slot in cash maintains
              optionality if Nifty pulls back to its rising 20-DMA. Discipline
              on trailing stops is the single biggest edge available to you next
              week — two positions still lack a defined stop, which is the first
              thing to fix.
            </p>
          </CardContent>
        </Card>

        {/* Insights grid */}
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-warning" />
              <h2 className="text-sm font-semibold">Key Observations</h2>
              <span className="font-mono text-[10px] text-muted-foreground">
                15 points
              </span>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {insights.map((ins, idx) => {
              const s = toneStyles(ins.tone);
              const Icon = s.icon;
              return (
                <Card
                  key={ins.id}
                  className={cn(
                    "group border-border/60 bg-card transition hover:border-border hover:bg-card/80",
                  )}
                >
                  <CardContent className="space-y-2 p-4">
                    <div className="flex items-start gap-2">
                      <div
                        className={cn(
                          "mt-0.5 rounded-md bg-secondary/60 p-1",
                          s.color,
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-muted-foreground">
                            #{String(idx + 1).padStart(2, "0")}
                          </span>
                          <span
                            className={cn("h-1.5 w-1.5 rounded-full", s.dot)}
                          />
                        </div>
                        <p className="mt-1 text-sm font-medium leading-snug">
                          {ins.title}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {ins.body}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Position verdicts */}
        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Per-Position Verdict</h2>
            </div>
            <span className="font-mono text-[10px] text-muted-foreground">
              {positionVerdicts.length} positions
            </span>
          </div>

          <Card className="overflow-hidden border-border/60 bg-card">
            <div className="divide-y divide-border/60">
              {positionVerdicts.map((p) => {
                const up = p.change >= 0;
                return (
                  <div
                    key={p.symbol}
                    className="grid grid-cols-12 items-center gap-3 px-4 py-3 transition hover:bg-secondary/30"
                  >
                    <div className="col-span-12 flex items-center gap-3 md:col-span-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary/60 font-mono text-[10px] font-semibold">
                        {p.symbol.slice(0, 3)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-mono text-sm font-semibold">
                            {p.symbol}
                          </p>
                          <span
                            className={cn(
                              "rounded border px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wider",
                              p.type === "New"
                                ? "border-primary/30 bg-primary/10 text-primary"
                                : "border-border/60 bg-secondary/40 text-muted-foreground",
                            )}
                          >
                            {p.type}
                          </span>
                        </div>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {p.name}
                        </p>
                      </div>
                    </div>

                    <div className="col-span-4 md:col-span-2">
                      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        Week
                      </p>
                      <p
                        className={cn(
                          "flex items-center gap-1 font-mono text-sm tabular-nums",
                          up ? "text-success" : "text-destructive",
                        )}
                      >
                        {up ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3" />
                        )}
                        {up ? "+" : ""}
                        {p.change.toFixed(2)}%
                      </p>
                    </div>

                    <div className="col-span-4 md:col-span-2">
                      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        R-Multiple
                      </p>
                      <p
                        className={cn(
                          "font-mono text-sm tabular-nums",
                          p.rr.startsWith("-")
                            ? "text-destructive"
                            : "text-success",
                        )}
                      >
                        {p.rr}
                      </p>
                    </div>

                    <div className="col-span-4 md:col-span-1">
                      <span
                        className={cn(
                          "inline-flex rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold",
                          verdictStyle[p.verdict],
                        )}
                      >
                        {p.verdict}
                      </span>
                    </div>

                    <div className="col-span-12 md:col-span-3">
                      <p className="text-xs text-muted-foreground">
                        {p.rationale}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Footer disclaimer */}
        <div className="mt-8 flex items-start gap-2 rounded-lg border border-border/60 bg-secondary/30 p-4">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            This review is generated by an AI model from your own position data
            and recent price action. It is not investment advice. Always confirm
            with your own checklist before acting on any suggestion. Last
            generated:{" "}
            <span className="font-mono">Sat, 20 Jun 2026 · 10:31 AM IST</span>.
          </p>
        </div>
      </main>
    </div>
  );
}
