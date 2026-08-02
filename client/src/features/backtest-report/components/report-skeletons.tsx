import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

/* Building blocks that mirror the real report components (report-shell.tsx). */

const TAB_COUNT = 5;

/** Mimics ReportShell: sticky header (title + version selectors + tab row) then
 * a max-w content column — so the loading state has the same frame as the page. */
function ShellSkeleton({ children }: { children: ReactNode }) {
  return (
    <div className="min-w-0">
      <header className="border-b border-border/60 bg-background/70 backdrop-blur-xl sticky top-0 z-10">
        <div className="h-16 flex items-center justify-between gap-4 px-8">
          <div className="min-w-0 space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-72" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-[260px]" />
            <Skeleton className="h-9 w-[150px]" />
          </div>
        </div>
        <div className="px-8 pb-3 flex flex-wrap items-center gap-2">
          {Array.from({ length: TAB_COUNT }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-28 rounded-lg" />
          ))}
          <div className="ml-auto flex items-center gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-5 w-16 rounded-md" />
          </div>
        </div>
      </header>
      <div className="p-8 space-y-6 max-w-[1600px]">{children}</div>
    </div>
  );
}

/** A card matching the real `Section` (header strip + body). */
function SectionSkeleton({ children, rows = 1 }: { children?: ReactNode; rows?: number }) {
  return (
    <section className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur shadow-[var(--shadow-card)]">
      <div className="flex items-start gap-3 px-6 pt-5 pb-4 border-b border-border/60">
        <Skeleton className="size-9 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-64" />
        </div>
      </div>
      <div className="p-6 space-y-3">{children ?? Array.from({ length: rows }).map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}</div>
    </section>
  );
}

function MetricGrid({ n = 6 }: { n?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border/60 bg-background/40 px-4 py-3 space-y-2">
          <Skeleton className="h-2.5 w-16" />
          <Skeleton className="h-6 w-20" />
        </div>
      ))}
    </div>
  );
}

function ChartSkeleton({ height = 260 }: { height?: number }) {
  return <Skeleton className="w-full rounded-lg" style={{ height }} />;
}

function TableSkeleton({ rows = 8, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2.5">
      <div className="grid gap-3 border-b border-border/60 pb-3" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-16" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="grid gap-3 py-1.5" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-4 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ── Per-page skeletons (match each page's real layout) ── */

export function MetricsGraphsSkeleton() {
  return (
    <ShellSkeleton>
      {Array.from({ length: 3 }).map((_, i) => (
        <SectionSkeleton key={i}>
          <MetricGrid n={6} />
        </SectionSkeleton>
      ))}
      <SectionSkeleton>
        <ChartSkeleton height={300} />
      </SectionSkeleton>
      <div className="grid xl:grid-cols-2 gap-6">
        <SectionSkeleton>
          <ChartSkeleton height={240} />
        </SectionSkeleton>
        <SectionSkeleton>
          <ChartSkeleton height={240} />
        </SectionSkeleton>
      </div>
      <SectionSkeleton>
        <ChartSkeleton height={220} />
      </SectionSkeleton>
    </ShellSkeleton>
  );
}

export function BlotterSkeleton() {
  return (
    <ShellSkeleton>
      <MetricGrid n={4} />
      <SectionSkeleton>
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      </SectionSkeleton>
    </ShellSkeleton>
  );
}

export function StockPerformanceSkeleton() {
  return (
    <ShellSkeleton>
      <MetricGrid n={5} />
      <SectionSkeleton>
        <TableSkeleton rows={10} cols={8} />
      </SectionSkeleton>
      <div className="grid xl:grid-cols-2 gap-6">
        <SectionSkeleton>
          <TableSkeleton rows={5} cols={5} />
        </SectionSkeleton>
        <SectionSkeleton>
          <TableSkeleton rows={5} cols={5} />
        </SectionSkeleton>
      </div>
    </ShellSkeleton>
  );
}

export function StockDetailSkeleton() {
  return (
    <div className="p-8 space-y-6 max-w-[1600px]">
      <div className="flex items-center gap-3">
        <Skeleton className="size-9 rounded-md" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-56" />
        </div>
      </div>
      <MetricGrid n={12} />
      <SectionSkeleton>
        <TableSkeleton rows={10} cols={9} />
      </SectionSkeleton>
    </div>
  );
}

export function DocumentationSkeleton() {
  return (
    <ShellSkeleton>
      <SectionSkeleton>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/60 bg-background/40 px-4 py-3 space-y-2">
              <Skeleton className="h-2.5 w-16" />
              <Skeleton className="h-5 w-24" />
            </div>
          ))}
        </div>
      </SectionSkeleton>
      <SectionSkeleton>
        <div className="space-y-2.5">
          {["w-full", "w-11/12", "w-full", "w-10/12", "w-9/12", "w-full", "w-8/12"].map((w, i) => (
            <Skeleton key={i} className={`h-3.5 ${w}`} />
          ))}
        </div>
      </SectionSkeleton>
    </ShellSkeleton>
  );
}
