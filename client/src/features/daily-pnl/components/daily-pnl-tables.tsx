import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fmtMoney, fmtSigned } from "./daily-pnl-format";
import type { DailyPnlSnapshot } from "../types/daily-pnl.types";

export function DailyPnlOpenTable({ snapshot }: { snapshot: DailyPnlSnapshot }) {
  const navigate = useNavigate();

  return (
    <Card className="border-border/70 bg-card/70" style={{ boxShadow: "var(--shadow-card)" }}>
      <CardHeader>
        <CardTitle className="text-base" style={{ fontFamily: "var(--font-display)" }}>
          Open positions · mark-to-market
        </CardTitle>
        <CardDescription>Today's move and since-entry unrealized P&amp;L.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {snapshot.openPositions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 px-6">No open positions.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/60">
                  <TableHead className="w-10 pl-6 pr-3">#</TableHead>
                  <TableHead className="pl-3 pr-3">Symbol</TableHead>
                  <TableHead className="pl-3 pr-3 text-right">Qty</TableHead>
                  <TableHead className="pl-3 pr-3 text-right">Entry</TableHead>
                  <TableHead className="pl-3 pr-3 text-right">Mark</TableHead>
                  <TableHead className="pl-3 pr-3 text-right">Today</TableHead>
                  <TableHead className="pl-3 pr-6 text-right">Unrealized P&amp;L</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {snapshot.openPositions.map((p, i) => (
                  <TableRow
                    key={p.id ?? `${p.symbol}-${i}`}
                    onClick={() => p.id && navigate(`/trades/${p.id}`)}
                    className={
                      p.id
                        ? "cursor-pointer border-border/60 transition-colors hover:bg-accent/20"
                        : "border-border/60"
                    }
                  >
                    <TableCell className="pl-6 pr-3 py-3 tabular text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="pl-3 pr-3 py-3 font-medium">{p.symbol}</TableCell>
                    <TableCell className="pl-3 pr-3 py-3 text-right tabular">{p.quantity}</TableCell>
                    <TableCell className="pl-3 pr-3 py-3 text-right tabular text-muted-foreground">
                      {fmtMoney(p.entryPrice)}
                    </TableCell>
                    <TableCell className="pl-3 pr-3 py-3 text-right tabular">{fmtMoney(p.markPrice)}</TableCell>
                    <TableCell
                      className={`pl-3 pr-3 py-3 text-right tabular ${
                        p.todayPnl == null
                          ? "text-muted-foreground"
                          : p.todayPnl >= 0
                            ? "text-primary"
                            : "text-destructive"
                      }`}
                    >
                      {p.todayPnl == null ? "—" : fmtSigned(p.todayPnl)}
                    </TableCell>
                    <TableCell
                      className={`pl-3 pr-6 py-3 text-right tabular ${
                        p.unrealizedPnl >= 0 ? "text-primary" : "text-destructive"
                      }`}
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
  const navigate = useNavigate();

  return (
    <Card className="border-border/70 bg-card/70" style={{ boxShadow: "var(--shadow-card)" }}>
      <CardHeader>
        <CardTitle className="text-base" style={{ fontFamily: "var(--font-display)" }}>
          Closed today
        </CardTitle>
        <CardDescription>Trades that exited today, realized P&amp;L.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {snapshot.closedToday.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 px-6">No trades closed today.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/60">
                  <TableHead className="w-10 pl-6 pr-3">#</TableHead>
                  <TableHead className="pl-3 pr-3">Symbol</TableHead>
                  <TableHead className="pl-3 pr-3 text-right">Exit price</TableHead>
                  <TableHead className="pl-3 pr-6 text-right">P&amp;L</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {snapshot.closedToday.map((t, i) => (
                  <TableRow
                    key={t.id ?? `${t.symbol}-${i}`}
                    onClick={() => t.id && navigate(`/trades/${t.id}`)}
                    className={
                      t.id
                        ? "cursor-pointer border-border/60 transition-colors hover:bg-accent/20"
                        : "border-border/60"
                    }
                  >
                    <TableCell className="pl-6 pr-3 py-3 tabular text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="pl-3 pr-3 py-3 font-medium">{t.symbol}</TableCell>
                    <TableCell className="pl-3 pr-3 py-3 text-right tabular text-muted-foreground">
                      {fmtMoney(t.exitPrice)}
                    </TableCell>
                    <TableCell
                      className={`pl-3 pr-6 py-3 text-right tabular ${
                        t.pnlAmount >= 0 ? "text-primary" : "text-destructive"
                      }`}
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
