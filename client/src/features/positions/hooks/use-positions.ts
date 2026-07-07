import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchPositions,
  createPosition,
  exitPosition,
} from "../api/positions-api";
import type {
  Position,
  EnrichedPosition,
  PositionsSummary,
  ExitPositionPayload,
} from "../types/positions.types";
import { daysSince } from "@/lib/positions-utils";

export const positionKeys = {
  all: ["positions"] as const,
  list: () => ["positions", "list"] as const,
};

/* Enrichment runs on the client so the API stays thin.
   Market-derived fields stay null until the weekly sync script has run. */
export function enrichPosition(p: Position): EnrichedPosition {
  const currentPrice = p.lastClosedWeeklyClose;
  const hasMarketData = currentPrice != null;

  let currentValue: number | null = null;
  let pnlAbs: number | null = null;
  let pnlPct: number | null = null;
  let riskToStop: number | null = null;
  let upsideFromHigh: number | null = null;

  if (hasMarketData) {
    // Prefer the P&L% the sync script computed (side-aware); else fall back.
    pnlPct =
      p.pnlPercent ??
      ((currentPrice - p.entryPrice) / p.entryPrice) * 100;
    pnlAbs = (p.investedAmount * pnlPct) / 100;
    currentValue = p.investedAmount + pnlAbs;

    const stop =
      p.trailingActive && p.trailingStopPrice != null
        ? p.trailingStopPrice
        : p.structureExitLow;
    riskToStop =
      stop != null ? ((stop - currentPrice) / currentPrice) * 100 : null;

    upsideFromHigh =
      p.highestCloseSinceEntry != null && p.highestCloseSinceEntry > 0
        ? ((currentPrice - p.highestCloseSinceEntry) /
            p.highestCloseSinceEntry) *
          100
        : null;
  }

  return {
    ...p,
    holdingDays: daysSince(p.tradeDate),
    hasMarketData,
    currentPrice,
    currentValue,
    pnlAbs,
    pnlPct,
    riskToStop,
    upsideFromHigh,
  };
}

export function deriveSummary(positions: EnrichedPosition[]): PositionsSummary {
  const totalInvested = positions.reduce((s, p) => s + p.investedAmount, 0);
  const sectors = new Set(positions.map((p) => p.sector));

  const synced = positions.filter((p) => p.hasMarketData);
  const syncedInvested = synced.reduce((s, p) => s + p.investedAmount, 0);
  const totalPnl = synced.reduce((s, p) => s + (p.pnlAbs ?? 0), 0);

  return {
    totalPositions: positions.length,
    totalInvested,
    longCount: positions.filter((p) => p.side === "long").length,
    shortCount: positions.filter((p) => p.side === "short").length,
    sectorCount: sectors.size,
    avgHold: positions.length
      ? Math.round(
          positions.reduce((s, p) => s + p.holdingDays, 0) / positions.length,
        )
      : 0,
    syncedCount: synced.length,
    totalPnl,
    totalPnlPct: syncedInvested > 0 ? (totalPnl / syncedInvested) * 100 : 0,
    trailCount: positions.filter((p) => p.trailingActive).length,
    signalCount: positions.filter((p) => p.exitSignal).length,
  };
}

export function usePositions() {
  return useQuery<Position[]>({
    queryKey: positionKeys.list(),
    queryFn: fetchPositions,
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreatePosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPosition,
    onSuccess: () => qc.invalidateQueries({ queryKey: positionKeys.all }),
  });
}

export function useExitPosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: ExitPositionPayload;
    }) => exitPosition(id, payload),
    onSuccess: () => {
      // Open positions drop the row; dashboard + history now include the trade
      qc.invalidateQueries({ queryKey: positionKeys.all });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["trades"] });
    },
  });
}
