import {
  BookOpen,
  Sparkles,
  Plus,
  Search,
  Layers,
  Gauge,
  Flame,
  Shield,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePlaybook } from "../hooks/use-playbook";
import { FILTERS } from "../types/playbook.types";
import { PlaybookKpiCard } from "../components/playbook-kpi-card";
import { SetupRow } from "../components/setup-row";
import { SetupDetail } from "../components/setup-detail";
import { USE_MOCK } from "../api/playbook-mock";

export function PlaybookPage() {
  const {
    query,
    setQuery,
    activeFilter,
    setActiveFilter,
    selectedSetup,
    setSelectedId,
    filteredSetups,
    kpis,
    isLoading,
  } = usePlaybook({ useMock: USE_MOCK });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading Playbook...
      </div>
    );
  }

  return (
    <div className="px-8 py-8 space-y-8 max-w-[1600px]">
      <main>
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Badge
                variant="outline"
                className="gap-1.5 border-primary/30 bg-primary/10 text-primary"
              >
                <BookOpen className="size-3" /> Playbook
              </Badge>
              <span className="text-xs text-muted-foreground">
                {kpis.totalSetups} setups · {kpis.activeCount} active
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              Setups &amp; Execution Rules
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Document every edge. Repeatable rules · risk envelopes · pre-trade
              checklists.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Sparkles className="size-4" /> Generate from history
            </Button>
            <Button size="sm" className="gap-2">
              <Plus className="size-4" /> New setup
            </Button>
          </div>
        </header>

        <section className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <PlaybookKpiCard
            icon={<Layers className="size-4" />}
            label="Documented Setups"
            value={String(kpis.totalSetups)}
            sub={`${kpis.activeCount} active · ${kpis.totalSetups - kpis.activeCount} idle`}
            tone="primary"
          />
          <PlaybookKpiCard
            icon={<Gauge className="size-4" />}
            label="Avg Win Rate"
            value={`${kpis.avgWinRate.toFixed(1)}%`}
            sub="Across tested setups"
            tone="success"
          />
          <PlaybookKpiCard
            icon={<Flame className="size-4" />}
            label="Best Expectancy"
            value={
              kpis.bestExpectancy
                ? `₹${kpis.bestExpectancy.expectancy.toLocaleString("en-IN")}`
                : "—"
            }
            sub={kpis.bestExpectancy ? kpis.bestExpectancy.name : "N/A"}
            tone="warning"
          />
          <PlaybookKpiCard
            icon={<Shield className="size-4" />}
            label="Max Risk / Trade"
            value="0.75%"
            sub="Hard cap of book"
            tone="destructive"
          />
        </section>

        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search setups, tags, categories…"
              className="h-10 rounded-lg border-border/70 bg-secondary/60 pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  activeFilter === f
                    ? "border-primary/40 bg-primary/15 text-primary"
                    : "border-border/60 bg-secondary/40 text-muted-foreground hover:text-foreground",
                )}
              >
                {f}
              </button>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto gap-2 text-muted-foreground"
          >
            <Filter className="size-4" /> More filters
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1.4fr)]">
          <div className="flex flex-col gap-3">
            {filteredSetups.map((s) => (
              <SetupRow
                key={s.id}
                setup={s}
                active={selectedSetup ? s.id === selectedSetup.id : false}
                onClick={() => setSelectedId(s.id)}
              />
            ))}
            {filteredSetups.length === 0 && (
              <div className="rounded-xl border border-dashed border-border/60 bg-card/40 p-10 text-center text-sm text-muted-foreground">
                No setups match your filters.
              </div>
            )}
          </div>

          <SetupDetail setup={selectedSetup} />
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          A playbook is only useful when you follow it. Review weekly · iterate
          monthly.
        </p>
      </main>
    </div>
  );
}
