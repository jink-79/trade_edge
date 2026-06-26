import { useState, useMemo, useEffect } from "react";
import {
  type ClosedTrade,
  type EnrichedTrade,
  type SortState,
  type FilterKey,
  type SortCol,
  type HistoryKpis,
} from "../types/history.types";
import { getClosedTrades } from "../api/history-api";
import { daysBetween, PAGE_SIZE } from "../utils/history-utils";

interface UseHistoryOptions {
  useMock?: boolean;
}

export function useHistory({ useMock = false }: UseHistoryOptions = {}) {
  const [rawTrades, setRawTrades] = useState<ClosedTrade[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sortState, setSortState] = useState<SortState>({
    col: "exitDate",
    dir: "desc",
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getClosedTrades(useMock)
      .then((data) => setRawTrades(data))
      .finally(() => setIsLoading(false));
  }, [useMock]);

  const enrichedTrades = useMemo<EnrichedTrade[]>(() => {
    return rawTrades.map((t) => {
      const invested = t.entryPrice * t.qty;
      const exitValue = t.exitPrice * t.qty;
      const pnlAbs = exitValue - invested;
      const holdingDays = daysBetween(t.entryDate, t.exitDate);
      const peakGain = t.highestCloseSinceEntry - t.entryPrice;
      const captureRatio =
        peakGain > 0 ? ((t.exitPrice - t.entryPrice) / peakGain) * 100 : 0;
      return { ...t, invested, exitValue, pnlAbs, holdingDays, captureRatio };
    });
  }, [rawTrades]);

  const kpis = useMemo<HistoryKpis | null>(() => {
    if (enrichedTrades.length === 0) return null;

    const totalInvested = enrichedTrades.reduce((s, t) => s + t.invested, 0);
    const totalPnl = enrichedTrades.reduce((s, t) => s + t.pnlAbs, 0);
    const totalPnlPct =
      totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

    const wins = enrichedTrades.filter((t) => t.pnlAbs > 0);
    const losses = enrichedTrades.filter((t) => t.pnlAbs <= 0);
    const winRate = (wins.length / enrichedTrades.length) * 100;

    const avgHold = Math.round(
      enrichedTrades.reduce((s, t) => s + t.holdingDays, 0) /
        enrichedTrades.length,
    );

    const best = [...enrichedTrades].sort(
      (a, b) => b.pnlPercent - a.pnlPercent,
    )[0];
    const worst = [...enrichedTrades].sort(
      (a, b) => a.pnlPercent - b.pnlPercent,
    )[0];

    const avgWin =
      wins.reduce((s, t) => s + t.pnlPercent, 0) / (wins.length || 1);
    const avgLoss =
      losses.reduce((s, t) => s + t.pnlPercent, 0) / (losses.length || 1);
    const expectancy = (winRate / 100) * avgWin + (1 - winRate / 100) * avgLoss;

    return {
      totalInvested,
      totalPnl,
      totalPnlPct,
      winRate,
      avgHold,
      best,
      worst,
      expectancy,
      winsCount: wins.length,
      lossesCount: losses.length,
    };
  }, [enrichedTrades]);

  const filteredTrades = useMemo(() => {
    let rows = enrichedTrades;
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (t) =>
          t.symbol.toLowerCase().includes(q) ||
          t.stockName.toLowerCase().includes(q) ||
          t.sector.toLowerCase().includes(q),
      );
    }
    if (filter === "wins") rows = rows.filter((t) => t.pnlAbs > 0);
    if (filter === "losses") rows = rows.filter((t) => t.pnlAbs <= 0);
    if (filter === "target")
      rows = rows.filter((t) => t.exitReason === "Target Hit");
    if (filter === "stop")
      rows = rows.filter((t) => t.exitReason === "Stop Hit");

    return [...rows].sort((a, b) => {
      const mul = sortState.dir === "asc" ? 1 : -1;
      if (sortState.col === "exitDate") {
        return (
          (new Date(a.exitDate).getTime() - new Date(b.exitDate).getTime()) *
          mul
        );
      }
      return (
        ((a[sortState.col] as number) - (b[sortState.col] as number)) * mul
      );
    });
  }, [enrichedTrades, search, filter, sortState]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredTrades.length / PAGE_SIZE));
  }, [filteredTrades]);

  const paginatedTrades = useMemo(() => {
    return filteredTrades.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [filteredTrades, page]);

  const handleSort = (col: SortCol) => {
    setSortState((prev) =>
      prev.col === col
        ? { col, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { col, dir: "desc" },
    );
    setPage(1);
  };

  const toggleRow = (id: string) => {
    setExpandedId((p) => (p === id ? null : id));
  };

  return {
    search,
    setSearch,
    filter,
    setFilter,
    sortState,
    expandedId,
    page,
    setPage,
    kpis,
    totalCount: enrichedTrades.length,
    filteredTrades,
    paginatedTrades,
    totalPages,
    handleSort,
    toggleRow,
    isLoading,
  };
}
