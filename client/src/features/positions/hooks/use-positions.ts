import { useQuery } from "@tanstack/react-query";
import { fetchPositions } from "../api/positions-api";
import type {
  PositionsResponse,
  EnrichedPosition,
  PositionsSummary,
} from "../types/positions.types";
import { daysSince } from "@/lib/positions-utils";

export const positionKeys = {
  all: ["positions"] as const,
  list: () => ["positions", "list"] as const,
};

/* Enrichment runs on the client so the API stays thin */
export function enrichPosition(
  p: PositionsResponse["data"][number],
): EnrichedPosition {
  const currentPrice = p.lastClosedWeeklyClose;
  const invested = p.entryPrice * p.qty;
  const currentValue = currentPrice * p.qty;
  const pnlAbs = currentValue - invested;
  const riskToStop =
    p.trailingActive && p.trailingStopPrice
      ? ((p.trailingStopPrice - currentPrice) / currentPrice) * 100
      : ((p.structureExitLow - currentPrice) / currentPrice) * 100;
  const upsideFromHigh =
    ((currentPrice - p.highestCloseSinceEntry) / p.highestCloseSinceEntry) *
    100;

  return {
    ...p,
    currentPrice,
    invested,
    currentValue,
    pnlAbs,
    riskToStop,
    upsideFromHigh,
    holdingDays: daysSince(p.entryDate),
  };
}

export function deriveSummary(positions: EnrichedPosition[]): PositionsSummary {
  const totalInvested = positions.reduce((s, p) => s + p.invested, 0);
  const totalCurrent = positions.reduce((s, p) => s + p.currentValue, 0);
  const totalPnl = totalCurrent - totalInvested;
  return {
    totalInvested,
    totalCurrent,
    totalPnl,
    totalPnlPct: totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0,
    winners: positions.filter((p) => p.pnlPercent > 0).length,
    losers: positions.filter((p) => p.pnlPercent < 0).length,
    trailCount: positions.filter((p) => p.trailingActive).length,
    signalCount: positions.filter((p) => p.exitSignal).length,
    avgHold: positions.length
      ? Math.round(
          positions.reduce((s, p) => s + p.holdingDays, 0) / positions.length,
        )
      : 0,
  };
}

export function usePositions() {
  return useQuery<PositionsResponse>({
    queryKey: positionKeys.list(),
    queryFn: fetchPositions,
    staleTime: 1000 * 60 * 2, // 2 min — positions change on each weekly candle
  });
}
