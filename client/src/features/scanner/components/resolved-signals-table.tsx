import { useMemo, useState } from "react";
import { CheckCircle2, Search } from "lucide-react";
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
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

const OUTCOME_STYLE: Record<string, string> = {
  TARGET: "bg-primary/10 text-primary border-primary/30",
  STOP: "bg-destructive/10 text-destructive border-destructive/30",
  TIMEOUT: "bg-amber-500/10 text-amber-400 border-amber-500/30",
};

export function ResolvedSignalsTable({
  signals,
}: {
  signals: ScannerSignal[];
}) {
  const [query, setQuery] = useState("");
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? signals.filter(
          (s) =>
            s.symbol.toLowerCase().includes(q) ||
            s.status.toLowerCase().includes(q),
        )
      : signals;
  }, [signals, query]);

  return (
    <Card className="border-border/60 bg-card/60 backdrop-blur overflow-hidden">
      <CardHeader className="pb-4 flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <CheckCircle2 className="size-4 text-primary" /> Resolved
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {signals.length} paper trades hit target, stop, or timed out.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search symbol, outcome…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8 h-9 w-[220px] bg-secondary/40"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {rows.length === 0 ? (
          <div className="py-14 text-center text-sm text-muted-foreground">
            {signals.length === 0
              ? "No resolved signals yet — they land here as paper trades hit target or stop."
              : "No signals match your search."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/60">
                  <TableHead className="pl-6">Symbol</TableHead>
                  <TableHead>Scan → Exit</TableHead>
                  <TableHead className="text-right">Entry</TableHead>
                  <TableHead className="text-right">Exit</TableHead>
                  <TableHead className="text-right">R</TableHead>
                  <TableHead className="text-right">Days</TableHead>
                  <TableHead className="pr-6">Outcome</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((s) => {
                  const e = s.entry;
                  const r = s.result;
                  const pos = (r?.rMultiple ?? 0) >= 0;
                  return (
                    <TableRow
                      key={s.id}
                      className="border-border/60 hover:bg-accent/20"
                    >
                      <TableCell className="pl-6 py-3.5 font-medium tabular">
                        {s.symbol}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs tabular">
                        {fmtDate(s.scanDate)} →{" "}
                        {r ? fmtDate(r.exitDate) : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular text-muted-foreground">
                        {e ? fmtPrice(e.entryPrice) : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular">
                        {r ? fmtPrice(r.exitPrice) : "—"}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right tabular font-medium",
                          pos ? "text-primary" : "text-destructive",
                        )}
                      >
                        {r?.rMultiple != null
                          ? `${r.rMultiple >= 0 ? "+" : ""}${r.rMultiple.toFixed(2)}R`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular text-muted-foreground">
                        {r ? `${r.daysToResolve}d` : "—"}
                      </TableCell>
                      <TableCell className="pr-6">
                        <Badge
                          className={cn(
                            "border hover:bg-transparent",
                            OUTCOME_STYLE[s.status],
                          )}
                        >
                          {s.status}
                        </Badge>
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
