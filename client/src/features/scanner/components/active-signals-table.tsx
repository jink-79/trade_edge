import { useMemo, useState } from "react";
import { CircleDot, Clock, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { fmtPrice } from "@/features/journal/utils/journal-utils";
import type { ScannerSignal } from "../types/scanner.types";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });

const rOf = (v: number | undefined, s: ScannerSignal) => {
  if (v == null || !s.entry) return null;
  const risk = s.entry.entryPrice - s.entry.stopPrice;
  return risk > 0 ? v / risk : null;
};

export function ActiveSignalsTable({ signals }: { signals: ScannerSignal[] }) {
  const [query, setQuery] = useState("");
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? signals.filter((s) => s.symbol.toLowerCase().includes(q))
      : signals;
  }, [signals, query]);

  return (
    <Card className="border-border/60 bg-card/60 backdrop-blur overflow-hidden">
      <CardHeader className="pb-4 flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Clock className="size-4 text-primary" /> Tracking
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {signals.length} open paper trades still resolving.
          </p>
        </div>
        <div className="relative">
          <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search symbol…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8 h-9 w-[200px] bg-secondary/40"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {rows.length === 0 ? (
          <div className="py-14 text-center text-sm text-muted-foreground">
            {signals.length === 0
              ? "Nothing tracking. Paste a Chartink list above to start."
              : "No signals match your search."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/60">
                  <TableHead className="pl-6">Symbol</TableHead>
                  <TableHead>Scan</TableHead>
                  <TableHead className="text-right">Entry</TableHead>
                  <TableHead className="text-right">Target / SL</TableHead>
                  <TableHead className="text-right">RSI(2)</TableHead>
                  <TableHead className="text-right">Days</TableHead>
                  <TableHead className="text-right">MFE / MAE</TableHead>
                  <TableHead className="pr-6">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((s) => {
                  const e = s.entry;
                  const t = s.tracking;
                  const mfeR = rOf(t?.mfe, s);
                  const maeR = rOf(t?.mae, s);
                  return (
                    <TableRow
                      key={s.id}
                      className="border-border/60 hover:bg-accent/20"
                    >
                      <TableCell className="pl-6 py-3.5 font-medium tabular">
                        {s.symbol}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs tabular">
                        {fmtDate(s.scanDate)}
                      </TableCell>
                      <TableCell className="text-right tabular">
                        {e ? fmtPrice(e.entryPrice) : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular">
                        {e ? (
                          <>
                            <span className="text-primary">
                              {fmtPrice(e.targetPrice)}
                            </span>
                            <span className="text-muted-foreground"> / </span>
                            <span className="text-destructive">
                              {fmtPrice(e.stopPrice)}
                            </span>
                          </>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular">
                        {e ? e.rsi2.toFixed(2) : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular text-muted-foreground">
                        {t ? `${t.daysHeld}d` : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular text-xs">
                        {mfeR != null ? (
                          <>
                            <span className="text-primary">
                              +{mfeR.toFixed(2)}R
                            </span>
                            <span className="text-muted-foreground"> / </span>
                            <span className="text-destructive">
                              −{(maeR ?? 0).toFixed(2)}R
                            </span>
                          </>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="pr-6">
                        {e ? (
                          <Badge className="border gap-1.5 bg-primary/10 text-primary border-primary/30 hover:bg-primary/10">
                            <CircleDot className="size-3" /> Tracking
                          </Badge>
                        ) : (
                          <Badge className="border gap-1.5 bg-secondary/50 text-muted-foreground border-border/60 hover:bg-secondary/50">
                            Awaiting data
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
