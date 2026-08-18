import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fmtMoney, fmtSigned } from "./daily-pnl-format";
import type { DailyPnlSnapshot } from "../types/daily-pnl.types";

export function DailyPnlOpenTable({ snapshot }: { snapshot: DailyPnlSnapshot }) {
  return (
    <Card className="border-border/70 bg-card/70" style={{ boxShadow: "var(--shadow-card)" }}>
      <CardHeader>
        <CardTitle className="text-base" style={{ fontFamily: "var(--font-display)" }}>
          Open positions · mark-to-market
        </CardTitle>
        <CardDescription>Unrealized P&amp;L at the last broker sync.</CardDescription>
      </CardHeader>
      <CardContent>
        {snapshot.openPositions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No open positions.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Entry</TableHead>
                  <TableHead className="text-right">Mark</TableHead>
                  <TableHead className="text-right">Unrealized P&amp;L</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {snapshot.openPositions.map((p) => (
                  <TableRow key={p.symbol}>
                    <TableCell className="font-medium">{p.symbol}</TableCell>
                    <TableCell className="text-right tabular-nums">{p.quantity}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtMoney(p.entryPrice)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtMoney(p.markPrice)}</TableCell>
                    <TableCell
                      className={`text-right tabular-nums ${p.unrealizedPnl >= 0 ? "text-primary" : "text-destructive"}`}
                    >
                      {fmtSigned(p.unrealizedPnl)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function DailyPnlClosedTable({ snapshot }: { snapshot: DailyPnlSnapshot }) {
  return (
    <Card className="border-border/70 bg-card/70" style={{ boxShadow: "var(--shadow-card)" }}>
      <CardHeader>
        <CardTitle className="text-base" style={{ fontFamily: "var(--font-display)" }}>
          Closed today
        </CardTitle>
        <CardDescription>Trades that exited today, realized P&amp;L.</CardDescription>
      </CardHeader>
      <CardContent>
        {snapshot.closedToday.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No trades closed today.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead className="text-right">Exit price</TableHead>
                  <TableHead className="text-right">P&amp;L</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {snapshot.closedToday.map((t, i) => (
                  <TableRow key={`${t.symbol}-${i}`}>
                    <TableCell className="font-medium">{t.symbol}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtMoney(t.exitPrice)}</TableCell>
                    <TableCell
                      className={`text-right tabular-nums ${t.pnlAmount >= 0 ? "text-primary" : "text-destructive"}`}
                    >
                      {fmtSigned(t.pnlAmount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
