import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fmtINR, fmtDate } from "@/lib/positions-utils";
import type { DashboardRecentTrade } from "../types/dashboard.types";

interface RecentTradesProps {
  trades: DashboardRecentTrade[];
}

export function RecentTrades({ trades }: RecentTradesProps) {
  return (
    <Card
      className="border-border/70 bg-card/70"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base font-semibold">
            Recent Trades
          </CardTitle>
          <CardDescription>Last {trades.length} closed positions</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        {trades.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No closed trades yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  <Th className="pl-6">Symbol</Th>
                  <Th>Exit Date</Th>
                  <Th>Reason</Th>
                  <Th className="text-right">P&L %</Th>
                  <Th className="text-right pr-6">P&L</Th>
                </tr>
              </thead>
              <tbody>
                {trades.map((t) => {
                  const pos = t.pnlAmount >= 0;
                  return (
                    <tr
                      key={t.id}
                      className="border-t border-border/60 hover:bg-accent/30 transition-colors"
                    >
                      <Td className="pl-6">
                        <div className="flex items-center gap-2.5">
                          <div className="size-7 rounded-md bg-accent/70 ring-1 ring-border/70 grid place-items-center text-[10px] font-semibold">
                            {t.symbol.slice(0, 2)}
                          </div>
                          <span className="font-medium">{t.symbol}</span>
                        </div>
                      </Td>
                      <Td className="text-muted-foreground tabular">
                        {fmtDate(t.exitDate)}
                      </Td>
                      <Td className="text-muted-foreground">{t.exitReason}</Td>
                      <Td
                        className={`text-right tabular ${pos ? "text-primary" : "text-destructive"}`}
                      >
                        {pos ? "+" : ""}
                        {t.pnlPercent.toFixed(2)}%
                      </Td>
                      <Td
                        className={`text-right pr-6 tabular font-medium ${pos ? "text-primary" : "text-destructive"}`}
                      >
                        {pos ? "+" : ""}
                        {fmtINR(t.pnlAmount)}
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
  );
}

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th className={`text-left font-medium py-3 px-3 ${className}`}>
      {children}
    </th>
  );
}
function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`py-3 px-3 ${className}`}>{children}</td>;
}
