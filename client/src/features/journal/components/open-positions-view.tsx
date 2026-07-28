import { useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  ExternalLink,
  Layers,
  LogOut,
  ShieldAlert,
  Wallet,
  Wand2,
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
import { fmtINR } from "../utils/journal-utils";
import { useJournalTrades, useSetGttPlaced } from "../hooks/use-journal";
import { ReviewTradeDialog } from "./review-trade-dialog";
import { ExitTradeDialog } from "./exit-trade-dialog";
import type { JournalTrade } from "../types/journal.types";

const KITE_GTT_URL = "https://kite.zerodha.com/gtt";

function Stat({
  icon: Icon,
  label,
  value,
  iconColor = "text-muted-foreground",
  accent = false,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  iconColor?: string;
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
            <Icon className={cn("size-3.5", iconColor)} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tabular">{value}</div>
      </CardContent>
    </Card>
  );
}

function GttCard({ trade }: { trade: JournalTrade }) {
  const setGtt = useSetGttPlaced();
  const e = trade.entry;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-secondary/20 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="size-8 rounded-lg grid place-items-center text-[10px] font-bold ring-1 ring-border/70 bg-[oklch(0.26_0.015_252)]">
          {e.ticker.slice(0, 2)}
        </div>
        <div className="text-sm">
          <span className="font-medium">SELL {e.quantity} {e.ticker}</span>
          <div className="text-xs text-muted-foreground tabular mt-0.5">
            Target{" "}
            <span className="text-primary">{fmtINR(e.targetPrice)}</span>
            <span className="mx-2 text-border">·</span>
            SL <span className="text-destructive">{fmtINR(e.stopPrice)}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <a href={KITE_GTT_URL} target="_blank" rel="noreferrer">
          <Button size="sm" variant="outline" className="h-8 gap-1.5 border-border/70">
            <ExternalLink className="size-3.5" /> Open Kite
          </Button>
        </a>
        <Button
          size="sm"
          className="h-8 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={setGtt.isPending}
          onClick={() => setGtt.mutate({ id: trade.id, placed: true })}
        >
          <CheckCircle2 className="size-3.5" /> Mark placed
        </Button>
      </div>
    </div>
  );
}

function Th({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <th className={`text-left font-medium py-3 px-3 ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`py-3.5 px-3 ${className}`}>{children}</td>;
}

export function OpenPositionsView() {
  const { data: trades, isLoading } = useJournalTrades();
  const [reviewTrade, setReviewTrade] = useState<JournalTrade | null>(null);
  const [exitTrade, setExitTrade] = useState<JournalTrade | null>(null);

  const open = useMemo(
    () => (trades ?? []).filter((t) => t.outcome === "STILL-OPEN"),
    [trades],
  );
  const invested = open.reduce(
    (s, t) => s + t.entry.entryPrice * t.entry.quantity,
    0,
  );
  const needsReview = open.filter((t) => t.needsReview).length;
  const gttPending = open.filter((t) => !t.gttPlaced);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading Positions...
      </div>
    );
  }

  return (
    <div className="px-8 py-8 space-y-8 max-w-[1600px]">
      {/* HERO */}
      <div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <span className="size-1.5 rounded-full bg-primary animate-pulse" />
          Open Positions · from Kite
        </div>
        <h1 className="mt-2 text-3xl md:text-4xl font-semibold">Open Positions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your auto-captured live trades. Place the target/SL GTT, then review
          the setup.
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Stat icon={Layers} label="Open" value={open.length} accent iconColor="text-primary" />
        <Stat icon={Wallet} label="Deployed" value={`₹${(invested / 100000).toFixed(2)}L`} iconColor="text-chart-3" />
        <Stat icon={ShieldAlert} label="GTT pending" value={gttPending.length} iconColor={gttPending.length ? "text-[oklch(0.82_0.16_85)]" : "text-muted-foreground"} />
        <Stat icon={Wand2} label="Needs review" value={needsReview} iconColor={needsReview ? "text-[oklch(0.82_0.16_85)]" : "text-muted-foreground"} />
      </div>

      {/* GTT TO PLACE */}
      {gttPending.length > 0 && (
        <Card className="border-[oklch(0.82_0.16_85/0.4)] bg-card/70" style={{ boxShadow: "var(--shadow-card)" }}>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ShieldAlert className="size-4 text-[oklch(0.82_0.16_85)]" /> GTT orders to place
            </CardTitle>
            <CardDescription>
              Place these one-cancels-other GTTs in Kite, then mark them placed.
              Target = entry + ATR · SL = entry − 0.5×ATR.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {gttPending.map((t) => (
              <GttCard key={t.id} trade={t} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* OPEN TABLE */}
      <Card className="border-border/70 bg-card/70" style={{ boxShadow: "var(--shadow-card)" }}>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Activity className="size-4 text-primary" /> Positions
          </CardTitle>
          <CardDescription>{open.length} open</CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {open.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              No open positions yet. They appear here after the daily capture
              picks up your Kite trades.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-t border-border/60 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    <Th className="pl-6">Ticker</Th>
                    <Th className="text-right">Qty</Th>
                    <Th className="text-right">Entry</Th>
                    <Th className="text-right">Target / SL</Th>
                    <Th className="text-right">RSI(2)</Th>
                    <Th>Status</Th>
                    <Th className="text-right pr-6">Action</Th>
                  </tr>
                </thead>
                <tbody>
                  {open.map((t) => {
                    const e = t.entry;
                    return (
                      <tr key={t.id} className="border-t border-border/60 hover:bg-accent/20 transition-colors">
                        <Td className="pl-6">
                          <span className="inline-flex items-center gap-1.5 font-medium">
                            {e.ticker}
                            {t.source === "auto" && (
                              <Badge className="border h-4 px-1 text-[9px] bg-primary/10 text-primary border-primary/30 hover:bg-primary/10">
                                AUTO
                              </Badge>
                            )}
                          </span>
                        </Td>
                        <Td className="text-right tabular">{e.quantity}</Td>
                        <Td className="text-right tabular">{fmtINR(e.entryPrice)}</Td>
                        <Td className="text-right tabular">
                          <span className="text-primary">{fmtINR(e.targetPrice)}</span>
                          <span className="text-muted-foreground"> / </span>
                          <span className="text-destructive">{fmtINR(e.stopPrice)}</span>
                        </Td>
                        <Td className="text-right tabular">{e.rsi2.toFixed(2)}</Td>
                        <Td>
                          {t.needsReview ? (
                            <Badge className="border h-4 px-1.5 text-[10px] bg-[oklch(0.82_0.16_85/0.12)] text-[oklch(0.82_0.16_85)] border-[oklch(0.82_0.16_85/0.3)]">
                              Needs review
                            </Badge>
                          ) : t.gttPlaced ? (
                            <Badge className="border h-4 px-1.5 text-[10px] bg-primary/10 text-primary border-primary/30">
                              <ArrowUpRight className="size-2.5 mr-0.5" /> Active
                            </Badge>
                          ) : (
                            <Badge className="border h-4 px-1.5 text-[10px] bg-secondary/50 text-muted-foreground border-border/60">
                              GTT pending
                            </Badge>
                          )}
                        </Td>
                        <Td className="text-right pr-6">
                          {t.needsReview ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 gap-1.5 border-[oklch(0.82_0.16_85/0.4)] text-[oklch(0.82_0.16_85)] hover:bg-[oklch(0.82_0.16_85/0.1)]"
                              onClick={() => setReviewTrade(t)}
                            >
                              <Wand2 className="size-3.5" /> Review
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => setExitTrade(t)}
                            >
                              <LogOut className="size-3.5" /> Exit
                            </Button>
                          )}
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <ReviewTradeDialog trade={reviewTrade} onClose={() => setReviewTrade(null)} />
      <ExitTradeDialog trade={exitTrade} onClose={() => setExitTrade(null)} />
    </div>
  );
}
