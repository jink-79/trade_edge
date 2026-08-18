import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fmtMoney, fmtPct } from "./algo-signals-format";
import type { SizedBuy } from "../types/algo-signals.types";

interface CandidateRow {
  symbol: string;
  metricPct: number;
}

// Renders `buy_candidates_ranked` in full (never dropped — near-misses matter
// for validation): the top `freeSlots` rows are pinned with the sized
// qty+amount from `to_buy_sized`; the rest sit under a divider, dimmed —
// same "didn't make the cut" treatment pulse-signals-table uses for
// untaken candidates (opacity-70).
export function AlgoSignalsCandidates({
  candidates,
  freeSlots,
  sized,
  metricLabel,
}: {
  candidates: CandidateRow[];
  freeSlots: number;
  sized?: SizedBuy[];
  metricLabel: string;
}) {
  const sizedBySymbol = new Map((sized ?? []).map((s) => [s.symbol, s]));
  const pinned = candidates.slice(0, Math.max(freeSlots, 0));
  const rest = candidates.slice(Math.max(freeSlots, 0));

  const renderRow = (c: CandidateRow, dimmed: boolean) => {
    const s = sizedBySymbol.get(c.symbol);
    return (
      <TableRow key={c.symbol} className={dimmed ? "opacity-70" : ""}>
        <TableCell className="font-medium">{c.symbol}</TableCell>
        <TableCell className="text-right tabular-nums">{fmtPct(c.metricPct)}</TableCell>
        <TableCell className="text-right tabular-nums">{s ? s.qty : "—"}</TableCell>
        <TableCell className="text-right tabular-nums">{s ? fmtMoney(s.amount) : "—"}</TableCell>
        <TableCell className="text-right">
          {!dimmed ? (
            <span className="rounded-md px-2 py-0.5 text-[11px] ring-1 bg-primary/12 text-primary ring-primary/25">
              BUY
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </TableCell>
      </TableRow>
    );
  };

  return (
    <Card className="border-border/70 bg-card/70" style={{ boxShadow: "var(--shadow-card)" }}>
      <CardHeader>
        <CardTitle className="text-base" style={{ fontFamily: "var(--font-display)" }}>
          Entry candidates · {candidates.length} ranked
        </CardTitle>
        <CardDescription>
          Ranked by {metricLabel}. Top {freeSlots} sized as today's free slots; the rest are
          shown for validation, not dropped.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {candidates.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No entry candidates today.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead className="text-right">{metricLabel}</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Signal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pinned.map((c) => renderRow(c, false))}
                {rest.length > 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-[10px] uppercase tracking-[0.16em] text-muted-foreground py-2 bg-accent/20"
                    >
                      Did not make the cut
                    </TableCell>
                  </TableRow>
                )}
                {rest.map((c) => renderRow(c, true))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
