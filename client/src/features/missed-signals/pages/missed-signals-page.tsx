import { useState } from "react";
import { Ghost, Percent, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { KpiCard } from "@/features/dashboard/components/kpi-card";
import { useMissedSignals } from "../hooks/use-missed-signals";

const DAY_OPTIONS = [30, 60, 90] as const;

const fmtPrice = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" });

export function MissedSignalsPage() {
  const [days, setDays] = useState<(typeof DAY_OPTIONS)[number]>(30);
  const { data, isLoading, error } = useMissedSignals(days);

  const notConfigured = (error as any)?.response?.status === 503;

  return (
    <div className="min-h-screen flex">
      <main className="flex-1 min-w-0">
        <div className="px-8 py-8 space-y-8 max-w-[1600px]">
          {/* header */}
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-xl font-semibold tracking-tight flex items-center gap-2.5">
                <div className="size-8 rounded-lg grid place-items-center bg-primary/15 ring-1 ring-primary/30">
                  <Ghost className="size-4 text-primary" />
                </div>
                Missed Signals
              </h1>
              <p className="text-xs text-muted-foreground mt-1.5 ml-[42px]">
                Qualifying buy candidates the system flagged that you never entered.
              </p>
            </div>
            <div className="inline-flex items-center rounded-lg border border-border/70 bg-card/60 p-0.5">
              {DAY_OPTIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`px-3 h-7 text-xs rounded-md transition-colors ${
                    days === d
                      ? "bg-accent/80 text-foreground ring-1 ring-border/80"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>

          {notConfigured ? (
            <Card className="border-border/70 bg-card/70">
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                Missed-signal tracking needs phalanx-live's Atlas cluster configured on this
                deployment (PHALANX_ATLAS_MONGODB_URI / PHALANX_ATLAS_DB_NAME).
              </CardContent>
            </Card>
          ) : isLoading || !data ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                  icon={Ghost}
                  label="Total missed"
                  value={String(data.totalMissed)}
                  positive={false}
                  foot={`last ${data.days} days`}
                />
                <KpiCard
                  icon={Percent}
                  label="Avg return"
                  value={data.avgReturnPct != null ? `${data.avgReturnPct >= 0 ? "+" : ""}${data.avgReturnPct.toFixed(2)}%` : "—"}
                  positive={data.avgReturnPct != null ? data.avgReturnPct >= 0 : true}
                  foot="across all missed"
                />
                <KpiCard
                  icon={TrendingUp}
                  label="Best missed"
                  value={data.bestMissed ? data.bestMissed.symbol : "—"}
                  positive
                  foot={
                    data.bestMissed?.returnPct != null
                      ? `+${data.bestMissed.returnPct.toFixed(2)}% since ${fmtDate(data.bestMissed.date)}`
                      : "no data yet"
                  }
                />
                <KpiCard
                  icon={TrendingDown}
                  label="Worst missed"
                  value={data.worstMissed ? data.worstMissed.symbol : "—"}
                  positive={false}
                  foot={
                    data.worstMissed?.returnPct != null
                      ? `${data.worstMissed.returnPct.toFixed(2)}% since ${fmtDate(data.worstMissed.date)}`
                      : "no data yet"
                  }
                />
              </div>

              {/* table */}
              <Card className="border-border/70 bg-card/70 overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Missed candidates</CardTitle>
                  <CardDescription>
                    Marked to the latest available close — not a simulated exact exit, so treat
                    this as a rough read on opportunity cost, not a precise backtest.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {data.signals.length === 0 ? (
                    <div className="py-12 text-center text-sm text-muted-foreground">
                      No missed candidates in this range — you took everything the system flagged.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent border-border/60">
                            <TableHead className="w-10 pl-6 pr-3">#</TableHead>
                            <TableHead className="pl-3 pr-3">Symbol</TableHead>
                            <TableHead className="pl-3 pr-3">Flagged</TableHead>
                            <TableHead className="pl-3 pr-3 text-right">Entry close</TableHead>
                            <TableHead className="pl-3 pr-3 text-right">Latest close</TableHead>
                            <TableHead className="pl-3 pr-6 text-right">Return</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.signals.map((s, i) => (
                            <TableRow key={`${s.symbol}-${s.date}`} className="border-border/60">
                              <TableCell className="pl-6 pr-3 py-3 tabular text-muted-foreground">
                                {i + 1}
                              </TableCell>
                              <TableCell className="pl-3 pr-3 py-3 font-medium">{s.symbol}</TableCell>
                              <TableCell className="pl-3 pr-3 py-3 text-muted-foreground tabular whitespace-nowrap">
                                {fmtDate(s.date)}
                              </TableCell>
                              <TableCell className="pl-3 pr-3 py-3 text-right tabular text-muted-foreground">
                                {fmtPrice(s.entryClose)}
                              </TableCell>
                              <TableCell className="pl-3 pr-3 py-3 text-right tabular text-muted-foreground">
                                {s.latestClose != null ? fmtPrice(s.latestClose) : "—"}
                              </TableCell>
                              <TableCell
                                className={`pl-3 pr-6 py-3 text-right tabular font-medium ${
                                  s.returnPct == null
                                    ? "text-muted-foreground"
                                    : s.returnPct >= 0
                                      ? "text-primary"
                                      : "text-destructive"
                                }`}
                              >
                                {s.returnPct == null ? "—" : `${s.returnPct >= 0 ? "+" : ""}${s.returnPct.toFixed(2)}%`}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
