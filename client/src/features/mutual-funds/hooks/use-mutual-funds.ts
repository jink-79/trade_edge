import { useState, useMemo, useEffect } from "react";
import {
  type MutualFundEntry,
  type MutualFundsSummary,
  type SortState,
  type FundCategory,
} from "../types/mutual-funds.types";
import { fetchMutualFunds } from "../api/mutual-funds-api";
import { PAGE_SIZE } from "../utils/mutual-funds-utils";

export function useMutualFunds() {
  const [entries, setEntries] = useState<MutualFundEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string>("all");
  const [sortState, setSortState] = useState<SortState>({
    col: "date",
    dir: "desc",
  });
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMutualFunds()
      .then((data) => setEntries(data))
      .catch((err) => console.error("Failed to fetch mutual funds:", err))
      .finally(() => setIsLoading(false));
  }, []);

  const summary = useMemo<MutualFundsSummary>(() => {
    const byCategory: Record<FundCategory, number> = {
      Smallcap: 0,
      Midcap: 0,
      Largecap: 0,
      Flexicap: 0,
    };
    let totalInvested = 0;
    let totalUnits = 0;

    entries.forEach((e) => {
      totalInvested += e.amount;
      totalUnits += e.units;
      byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount;
    });

    return {
      totalInvested,
      totalUnits,
      totalEntries: entries.length,
      byCategory,
    };
  }, [entries]);

  const avgNav = useMemo(() => {
    if (summary.totalUnits === 0) return 0;
    return summary.totalInvested / summary.totalUnits;
  }, [summary]);

  const filteredEntries = useMemo(() => {
    let rows = entries;
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (e) =>
          e.fundName.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q),
      );
    }
    if (filterCat !== "all") {
      rows = rows.filter((e) => e.category === filterCat);
    }

    return [...rows].sort((a, b) => {
      const multiplier = sortState.dir === "asc" ? 1 : -1;
      if (sortState.col === "date") {
        return (
          (new Date(a.date).getTime() - new Date(b.date).getTime()) * multiplier
        );
      }
      if (sortState.col === "fundName") {
        return a.fundName.localeCompare(b.fundName) * multiplier;
      }
      const valA = a[sortState.col as keyof MutualFundEntry];
      const valB = b[sortState.col as keyof MutualFundEntry];
      if (typeof valA === "number" && typeof valB === "number") {
        return (valA - valB) * multiplier;
      }
      return 0;
    });
  }, [entries, search, filterCat, sortState]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredEntries.length / PAGE_SIZE));
  }, [filteredEntries]);

  const paginatedEntries = useMemo(() => {
    return filteredEntries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [filteredEntries, page]);

  const handleSort = (col: string) => {
    setSortState((prev) => ({
      col,
      dir: prev.col === col && prev.dir === "desc" ? "asc" : "desc",
    }));
    setPage(1);
  };

  const handleAddEntry = (newEntry: MutualFundEntry) => {
    setEntries((prev) => [newEntry, ...prev]);
    setPage(1);
  };

  return {
    summary,
    avgNav,
    showForm,
    setShowForm,
    search,
    setSearch,
    filterCat,
    setFilterCat,
    sortState,
    page,
    setPage,
    totalPages,
    paginatedEntries,
    filteredCount: filteredEntries.length,
    handleSort,
    handleAddEntry,
    isLoading,
  };
}
