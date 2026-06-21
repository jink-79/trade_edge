import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const fmtUsd2 = (n: number) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });

const recentTrades = [
  {
    sym: "NVDA",
    side: "LONG",
    qty: 40,
    entry: 118.42,
    exit: 124.1,
    pnl: 227.2,
    r: 2.1,
  },
  {
    sym: "TSLA",
    side: "SHORT",
    qty: 25,
    entry: 248.5,
    exit: 241.9,
    pnl: 165.0,
    r: 1.4,
  },
  {
    sym: "AAPL",
    side: "LONG",
    qty: 60,
    entry: 192.1,
    exit: 190.3,
    pnl: -108.0,
    r: -0.7,
  },
  {
    sym: "MSFT",
    side: "LONG",
    qty: 30,
    entry: 412.6,
    exit: 421.4,
    pnl: 264.0,
    r: 1.9,
  },
  {
    sym: "AMD",
    side: "SHORT",
    qty: 80,
    entry: 158.2,
    exit: 162.8,
    pnl: -368.0,
    r: -1.2,
  },
  {
    sym: "META",
    side: "LONG",
    qty: 18,
    entry: 498.3,
    exit: 511.7,
    pnl: 241.2,
    r: 1.6,
  },
];

export function RecentTrades() {
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
          <CardDescription>Last 6 closed positions</CardDescription>
        </div>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          View all
        </Button>
      </CardHeader>
      <CardContent className="px-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                <Th className="pl-6">Symbol</Th>
                <Th>Side</Th>
                <Th className="text-right">Qty</Th>
                <Th className="text-right">Entry</Th>
                <Th className="text-right">Exit</Th>
                <Th className="text-right">R</Th>
                <Th className="text-right pr-6">P&L</Th>
              </tr>
            </thead>
            <tbody>
              {recentTrades.map((t, i) => (
                <tr
                  key={i}
                  className="border-t border-border/60 hover:bg-accent/30 transition-colors"
                >
                  <Td className="pl-6">
                    <div className="flex items-center gap-2.5">
                      <div className="size-7 rounded-md bg-accent/70 ring-1 ring-border/70 grid place-items-center text-[10px] font-semibold">
                        {t.sym.slice(0, 2)}
                      </div>
                      <span className="font-medium">{t.sym}</span>
                    </div>
                  </Td>
                  <Td>
                    <Badge
                      variant="outline"
                      className={`border-border/70 text-[10px] font-medium tracking-wider ${
                        t.side === "LONG"
                          ? "text-primary bg-primary/10 border-primary/30"
                          : "text-chart-2 bg-chart-2/10 border-chart-2/30"
                      }`}
                    >
                      {t.side}
                    </Badge>
                  </Td>
                  <Td className="text-right tabular">{t.qty}</Td>
                  <Td className="text-right tabular">{fmtUsd2(t.entry)}</Td>
                  <Td className="text-right tabular">{fmtUsd2(t.exit)}</Td>
                  <Td
                    className={`text-right tabular ${
                      t.r >= 0 ? "text-primary" : "text-destructive"
                    }`}
                  >
                    {t.r > 0 ? "+" : ""}
                    {t.r}R
                  </Td>
                  <Td
                    className={`text-right pr-6 tabular font-medium ${
                      t.pnl >= 0 ? "text-primary" : "text-destructive"
                    }`}
                  >
                    {t.pnl >= 0 ? "+" : ""}
                    {fmtUsd2(t.pnl)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
