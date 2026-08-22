import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fmtINR, fmtDate } from "@/lib/positions-utils";
import type { DashboardRecentTrade } from "../types/dashboard.types";

interface RecentTradesProps {
  trades: DashboardRecentTrade[];
}

export function RecentTrades({ trades }: RecentTradesProps) {
  const navigate = useNavigate();

  return (
    <Card
      className="border-border/70 bg-card/70 overflow-hidden"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <CardHeader>
        <CardTitle className="text-base font-semibold">Recent Trades</CardTitle>
        <CardDescription>Last {trades.length} closed positions</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {trades.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No closed trades yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/60">
                  <TableHead className="w-10 pl-6 pr-3">#</TableHead>
                  <TableHead className="pl-3 pr-3">Symbol</TableHead>
                  <TableHead className="pl-3 pr-3">Exit date</TableHead>
                  <TableHead className="pl-3 pr-3">Reason</TableHead>
                  <TableHead className="pl-3 pr-3 text-right">P&amp;L %</TableHead>
                  <TableHead className="pl-3 pr-6 text-right">P&amp;L</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trades.map((t, i) => {
                  const pos = t.pnlAmount >= 0;
                  return (
                    <TableRow
                      key={t.id}
                      onClick={() => navigate(`/trades/${t.id}`)}
                      className="cursor-pointer border-border/60 transition-colors hover:bg-accent/20"
                    >
                      <TableCell className="pl-6 pr-3 py-3 tabular text-muted-foreground">
                        {i + 1}
                      </TableCell>
                      <TableCell className="pl-3 pr-3 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="size-7 rounded-md bg-accent/70 ring-1 ring-border/70 grid place-items-center text-[10px] font-semibold">
                            {t.symbol.slice(0, 2)}
                          </div>
                          <span className="font-medium">{t.symbol}</span>
                        </div>
                      </TableCell>
                      <TableCell className="pl-3 pr-3 py-3 text-muted-foreground tabular whitespace-nowrap">
                        {fmtDate(t.exitDate)}
                      </TableCell>
                      <TableCell className="pl-3 pr-3 py-3 text-muted-foreground">
                        {t.exitReason}
                      </TableCell>
                      <TableCell
                        className={`pl-3 pr-3 py-3 text-right tabular ${pos ? "text-primary" : "text-destructive"}`}
                      >
                        {pos ? "+" : ""}
                        {t.pnlPercent.toFixed(2)}%
                      </TableCell>
                      <TableCell
                        className={`pl-3 pr-6 py-3 text-right tabular font-medium ${pos ? "text-primary" : "text-destructive"}`}
                      >
                        {pos ? "+" : ""}
                        {fmtINR(t.pnlAmount)}
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
