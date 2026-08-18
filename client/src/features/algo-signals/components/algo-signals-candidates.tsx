import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fmtMoney, fmtPct } from "./algo-signals-format";
import type { SizedBuy } from "../types/algo-signals.types";

interface CandidateRow {
  symbol: string;
  metricPct: number;
}

// Renders `buy_candidates_ranked` in full (never dropped — near-misses matter
// for validation): the top `freeSlots` rows are pinned/highlighted with the
// sized qty+amount from `to_buy_sized`; the rest sit under a "did not make
// the cut" divider, greyed out.
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
      <TableRow key={c.symbol} className={dimmed ? "opacity-50" : ""}>
        <TableCell className="font-medium">{c.symbol}</TableCell>
        <TableCell className="text-right tabular-nums">{fmtPct(c.metricPct)}</TableCell>
        <TableCell className="text-right tabular-nums">{s ? s.qty : "—"}</TableCell>
        <TableCell className="text-right tabular-nums">{s ? fmtMoney(s.amount) : "—"}</TableCell>
        <TableCell className="text-right">
          {!dimmed && <Badge>BUY</Badge>}
        </TableCell>
      </TableRow>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entry candidates</CardTitle>
        <CardDescription>
          Ranked by {metricLabel} — top {freeSlots} sized as today's free slots, rest shown for
          validation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {candidates.length === 0 ? (
          <p className="text-sm text-muted-foreground">No entry candidates today.</p>
        ) : (
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
                  <TableCell colSpan={5} className="text-center text-[10px] uppercase tracking-[0.16em] text-muted-foreground py-1.5">
                    Did not make the cut
                  </TableCell>
                </TableRow>
              )}
              {rest.map((c) => renderRow(c, true))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
