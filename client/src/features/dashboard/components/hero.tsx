import { Badge } from "@/components/ui/badge";
import { fmtINR } from "@/lib/positions-utils";
import type {
  DashboardPortfolio,
  DashboardTradeStats,
} from "../types/dashboard.types";

interface HeroProps {
  userName?: string;
  portfolio: DashboardPortfolio;
  tradeStats: DashboardTradeStats;
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function Hero({ userName, portfolio, tradeStats }: HeroProps) {
  const firstName = userName?.split(" ")[0] ?? "Trader";
  const pnlPos = tradeStats.netPnl >= 0;

  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <span className="size-1.5 rounded-full bg-primary animate-pulse" />
          Live · Portfolio overview
        </div>
        <h1 className="mt-2 text-3xl md:text-4xl font-semibold">
          {greeting()}, {firstName}.
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Portfolio value{" "}
          <span className="text-foreground tabular">
            {fmtINR(portfolio.totalValue)}
          </span>{" "}
          · realised{" "}
          <span
            className={
              pnlPos ? "text-primary tabular" : "text-destructive tabular"
            }
          >
            {pnlPos ? "+" : ""}
            {fmtINR(tradeStats.netPnl)}
          </span>{" "}
          across {tradeStats.totalTrades} closed trades.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge
          className={`border ${
            pnlPos
              ? "bg-primary/15 text-primary border-primary/30 hover:bg-primary/15"
              : "bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/15"
          }`}
        >
          Win rate · {tradeStats.winRate.toFixed(1)}%
        </Badge>
      </div>
    </div>
  );
}
