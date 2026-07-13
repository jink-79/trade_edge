import { useState, useMemo, useEffect } from "react";
import {
  type Setup,
  type FilterKey,
  type PlaybookKpis,
} from "../types/playbook.types";
import { getSetups } from "../api/playbook-api";

interface UsePlaybookOptions {
  useMock?: boolean;
}

export function usePlaybook({ useMock = false }: UsePlaybookOptions = {}) {
  const [setups, setSetups] = useState<Setup[]>([]);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getSetups(useMock)
      .then((data) => {
        setSetups(data);
        if (data.length > 0) {
          setSelectedId(data[0].id);
        }
      })
      .finally(() => setIsLoading(false));
  }, [useMock]);

  const filteredSetups = useMemo(() => {
    return setups.filter((s) => {
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.tag.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q);

      const matchesFilter =
        activeFilter === "All" ||
        s.status === activeFilter ||
        s.bias === activeFilter ||
        s.timeframe === activeFilter;

      return matchesQuery && matchesFilter;
    });
  }, [setups, query, activeFilter]);

  const selectedSetup = useMemo(() => {
    if (!setups.length) return null;
    return (
      setups.find((s) => s.id === selectedId) ?? filteredSetups[0] ?? setups[0]
    );
  }, [setups, selectedId, filteredSetups]);

  const kpis = useMemo<PlaybookKpis>(() => {
    const totalSetups = setups.length;
    const activeCount = setups.filter((s) => s.status === "Active").length;

    const setupsWithTrades = setups.filter((s) => s.trades > 0);
    const avgWinRate = setupsWithTrades.length
      ? setupsWithTrades.reduce((a, s) => a + s.winRate, 0) /
        setupsWithTrades.length
      : 0;

    const bestExpectancy = setups.reduce(
      (m, s) => (s.expectancy > (m?.expectancy ?? -Infinity) ? s : m),
      setups[0],
    );

    return {
      totalSetups,
      activeCount,
      avgWinRate,
      bestExpectancy,
    };
  }, [setups]);

  return {
    query,
    setQuery,
    activeFilter,
    setActiveFilter,
    selectedSetup,
    setSelectedId,
    filteredSetups,
    kpis,
    setups,
    isLoading,
  };
}
