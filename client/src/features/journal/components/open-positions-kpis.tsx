import { useMemo } from "react";
import { ListChecks, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { KpiCard } from "@/features/dashboard/components/kpi-card";
import { fmtINR } from "../utils/journal-utils";
import type { JournalTrade } from "../types/journal.types";

function dailyPnlPerShare(t: JournalTrade): number | null {
  if (t.markPrice == null || t.markPrevClose == null) return null;
  const long = t.entry.direction !== "SHORT";
  return long ? t.markPrice - t.markPrevClose : t.markPrevClose - t.markPrice;
}

export function OpenPositionsKpis({
  trades,
}: {
  trades: JournalTrade[];
}) {
  const k = useMemo(() => {
    let deployed = 0;
    let unrealizedPnl = 0;
    let pricedDeployed = 0;
    let dailyPnl = 0;
    let dailyBase = 0;
    let topMover: { symbol: string; pct: number } | null = null;
    let topLoser: { symbol: string; pct: number } | null = null;

    for (const t of trades) {
      const capital = t.entry.entryPrice * t.entry.quantity;
      deployed += capital;

      if (t.markPrice != null) {
        pricedDeployed += capital;
        const long = t.entry.direction !== "SHORT";
        const pnlPerShare = long
          ? t.markPrice - t.entry.entryPrice
          : t.entry.entryPrice - t.markPrice;
        unrealizedPnl += pnlPerShare * t.entry.quantity;
      }

      const dailyPerShare = dailyPnlPerShare(t);
      if (dailyPerShare != null && t.markPrevClose) {
        dailyPnl += dailyPerShare * t.entry.quantity;
        dailyBase += t.markPrevClose * t.entry.quantity;
        const pct = (dailyPerShare / t.markPrevClose) * 100;
        if (!topMover || pct > topMover.pct) {
          topMover = { symbol: t.entry.ticker, pct };
        }
        if (!topLoser || pct < topLoser.pct) {
          topLoser = { symbol: t.entry.ticker, pct };
        }
      }
    }

    return {
      deployed,
      unrealizedPnl,
      unrealizedPct: pricedDeployed > 0 ? (unrealizedPnl / pricedDeployed) * 100 : 0,
      dailyPnl,
      dailyPct: dailyBase > 0 ? (dailyPnl / dailyBase) * 100 : 0,
      needsReview: trades.filter((t) => t.needsReview).length,
      topMover,
      topLoser,
    };
  }, [trades]);

  const pnlPositive = k.unrealizedPnl >= 0;
  const dailyPositive = k.dailyPnl >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <KpiCard
        icon={ListChecks}
        label="Open positions"
        value={String(trades.length)}
        positive
        foot={k.needsReview > 0 ? `${k.needsReview} to review` : "all reviewed"}
      />
      <KpiCard
        icon={Wallet}
        label="Capital deployed"
        value={fmtINR(k.deployed)}
        positive
        foot="at entry price"
      />
      <KpiCard
        icon={TrendingUp}
        label="Unrealised P&L"
        value={`${pnlPositive ? "+" : ""}${fmtINR(k.unrealizedPnl)}`}
        delta={`${k.unrealizedPct >= 0 ? "+" : ""}${k.unrealizedPct.toFixed(2)}%`}
        positive={pnlPositive}
        foot="vs capital deployed"
        accent
      />
      <KpiCard
        icon={TrendingUp}
        label="Daily P&L"
        value={`${dailyPositive ? "+" : ""}${fmtINR(k.dailyPnl)}`}
        delta={`${k.dailyPct >= 0 ? "+" : ""}${k.dailyPct.toFixed(2)}%`}
        positive={dailyPositive}
        foot="today's move, all positions"
      />
      <KpiCard
        icon={TrendingUp}
        label="Today's top mover"
        value={k.topMover ? k.topMover.symbol : "—"}
        positive={k.topMover ? k.topMover.pct >= 0 : true}
        foot={
          k.topMover
            ? `${k.topMover.pct >= 0 ? "+" : ""}${k.topMover.pct.toFixed(2)}% today`
            : "no data yet"
        }
      />
      <KpiCard
        icon={TrendingDown}
        label="Today's top loser"
        value={k.topLoser ? k.topLoser.symbol : "—"}
        positive={k.topLoser ? k.topLoser.pct >= 0 : false}
        foot={
          k.topLoser
            ? `${k.topLoser.pct >= 0 ? "+" : ""}${k.topLoser.pct.toFixed(2)}% today`
            : "no data yet"
        }
      />
    </div>
  );
}
