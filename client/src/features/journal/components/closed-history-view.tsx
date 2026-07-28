import { useMemo } from "react";
import { BarChart3, Percent, TrendingUp, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { deriveExitMetrics, fmtINR } from "../utils/journal-utils";
import { useJournalTrades } from "../hooks/use-journal";
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
  "MANUAL-EXIT":
    "bg-[oklch(0.82_0.16_85/0.1)] text-[oklch(0.82_0.16_85)] border-[oklch(0.82_0.16_85/0.3)]",
};

function metricsFor(t: JournalTrade) {
  if (!t.exit) return null;
  return deriveExitMetrics(
    {
      direction: t.entry.direction,
      entryPrice: t.entry.entryPrice,
      stopPrice: t.entry.stopPrice,
      quantity: t.entry.quantity,
      entryDate: t.entry.entryDate,
    },
    { exitPrice: t.exit.exitPrice, exitDate: t.exit.exitDate },
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  tone?: "default" | "good" | "bad";
}) {
  return (
    <Card className="border-border/70 bg-card/70" style={{ boxShadow: "var(--shadow-card)" }}>
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
      </CardContent>
    </Card>
  );
}

function Th({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <th className={`text-left font-medium py-3 px-3 ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`py-3.5 px-3 ${className}`}>{children}</td>;
}

export function ClosedHistoryView() {
  const { data: trades, isLoading } = useJournalTrades();

  const closed = useMemo(
    () => (trades ?? []).filter((t) => t.outcome !== "STILL-OPEN" && t.exit),
    [trades],
  );

  const kpis = useMemo(() => {
    if (closed.length === 0) return null;
    let net = 0;
    let wins = 0;
    let rSum = 0;
    let rCount = 0;
    for (const t of closed) {
      const m = metricsFor(t);
      if (!m) continue;
      net += m.realizedPnl;
      if (m.win) wins++;
      if (m.rMultiple != null) {
        rSum += m.rMultiple;
        rCount++;
      }
    }
    return {
      net,
      winRate: (wins / closed.length) * 100,
      avgR: rCount > 0 ? rSum / rCount : null,
    };
  }, [closed]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading Trade History...
      </div>
    );
  }

  return (
    <div className="px-8 py-8 space-y-8 max-w-[1600px]">
      <div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <span className="size-1.5 rounded-full bg-primary animate-pulse" />
          Trade History · from Kite
        </div>
        <h1 className="mt-2 text-3xl md:text-4xl font-semibold">Trade History</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your closed trades — realized P&amp;L and R-multiple, computed from
          entry &amp; exit.
        </p>
      </div>

      {kpis && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat icon={BarChart3} label="Closed" value={String(closed.length)} />
          <Stat
            icon={TrendingUp}
            label="Net P&L"
            value={`${kpis.net >= 0 ? "+" : "−"}${fmtINR(Math.abs(kpis.net))}`}
            tone={kpis.net >= 0 ? "good" : "bad"}
          />
          <Stat icon={Percent} label="Win rate" value={`${kpis.winRate.toFixed(1)}%`} />
          <Stat
            icon={Trophy}
            label="Avg R"
            value={kpis.avgR != null ? `${kpis.avgR.toFixed(2)}R` : "—"}
            tone={kpis.avgR != null ? (kpis.avgR >= 0 ? "good" : "bad") : "default"}
          />
        </div>
      )}

      <Card className="border-border/70 bg-card/70" style={{ boxShadow: "var(--shadow-card)" }}>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BarChart3 className="size-4 text-primary" /> Closed Trades
          </CardTitle>
          <CardDescription>{closed.length} recorded</CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {closed.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              No closed trades yet. They appear here once you exit an open
              position.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-t border-border/60 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    <Th className="pl-6">Ticker</Th>
                    <Th>Entry → Exit</Th>
                    <Th className="text-right">Entry / Exit</Th>
                    <Th>Outcome</Th>
                    <Th className="text-right">P&L</Th>
                    <Th className="text-right pr-6">R</Th>
                  </tr>
                </thead>
                <tbody>
                  {closed.map((t) => {
                    const m = metricsFor(t);
                    const pos = (m?.realizedPnl ?? 0) >= 0;
                    return (
                      <tr key={t.id} className="border-t border-border/60 hover:bg-accent/20 transition-colors">
                        <Td className="pl-6 font-medium">{t.entry.ticker}</Td>
                        <Td className="tabular text-muted-foreground text-xs">
                          {fmtDate(t.entry.entryDate)} →{" "}
                          {t.exit ? fmtDate(t.exit.exitDate) : "—"}
                        </Td>
                        <Td className="text-right tabular">
                          {fmtINR(t.entry.entryPrice)}
                          <span className="text-muted-foreground"> → </span>
                          {t.exit ? fmtINR(t.exit.exitPrice) : "—"}
                        </Td>
                        <Td>
                          <Badge className={cn("border h-4 px-1.5 text-[10px]", OUTCOME_STYLE[t.outcome])}>
                            {t.outcome}
                          </Badge>
                        </Td>
                        <Td className={cn("text-right tabular font-medium", pos ? "text-primary" : "text-destructive")}>
                          {m ? (
                            <>
                              {pos ? "+" : "−"}
                              {fmtINR(Math.abs(m.realizedPnl))}
                              <span className="text-muted-foreground text-xs">
                                {" "}
                                ({pos ? "+" : ""}
                                {m.realizedPnlPct.toFixed(2)}%)
                              </span>
                            </>
                          ) : (
                            "—"
                          )}
                        </Td>
                        <Td className={cn("text-right pr-6 tabular", pos ? "text-primary" : "text-destructive")}>
                          {m?.rMultiple != null ? `${m.rMultiple.toFixed(2)}R` : "—"}
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
    </div>
  );
}
