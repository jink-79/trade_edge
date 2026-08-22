import { useMemo } from "react";
import { Flame, ListChecks, TrendingUp, Wallet } from "lucide-react";
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
    let mover: { symbol: string; pct: number } | null = null;

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
        if (!mover || Math.abs(pct) > Math.abs(mover.pct)) {
          mover = { symbol: t.entry.ticker, pct };
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
      mover,
    };
  }, [trades]);

  const pnlPositive = k.unrealizedPnl >= 0;
  const dailyPositive = k.dailyPnl >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
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
        icon={Flame}
        label="Today's mover"
        value={k.mover ? k.mover.symbol : "—"}
        positive={k.mover ? k.mover.pct >= 0 : true}
        foot={k.mover ? `${k.mover.pct >= 0 ? "+" : ""}${k.mover.pct.toFixed(2)}% today` : "no data yet"}
      />
    </div>
  );
}
