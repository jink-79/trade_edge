import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

/* App-wide loading skeletons. Each page skeleton mirrors that page's real
 * layout (header + KPI tiles + table / cards / charts) so the loading state
 * has the same shape as the loaded page instead of a centered spinner. */

function PageWrap({ children }: { children: ReactNode }) {
  return <div className="px-8 py-8 space-y-8 max-w-[1600px]">{children}</div>;
}

function HeaderSkel({ hero = false }: { hero?: boolean }) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-7 w-56" />
      <Skeleton className="h-4 w-80 max-w-full" />
      {hero && <Skeleton className="mt-2 h-24 w-full rounded-2xl" />}
    </div>
  );
}

function TilesSkel({ n = 4 }: { n?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border/60 bg-card/50 p-5 space-y-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

function Rows({ rows = 8, cols = 6 }: { rows?: number; cols?: number }) {
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

function TableSkel({ rows = 8, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/50 p-5 space-y-4">
      <Skeleton className="h-5 w-40" />
      <Rows rows={rows} cols={cols} />
    </div>
  );
}

function CardsSkel({ n = 6 }: { n?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: n }).map((_, i) => (
        <Skeleton key={i} className="h-40 rounded-2xl" />
      ))}
    </div>
  );
}

function ChartSkel({ h = 300 }: { h?: number }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/50 p-5 space-y-4">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="w-full rounded-lg" style={{ height: h }} />
    </div>
  );
}

/* ── Per-page skeletons ── */

export function DashboardSkeleton() {
  return (
    <PageWrap>
      <HeaderSkel />
      <TilesSkel n={4} />
      <div className="grid xl:grid-cols-2 gap-6">
        <ChartSkel h={280} />
        <ChartSkel h={280} />
      </div>
      <TableSkel rows={6} cols={6} />
    </PageWrap>
  );
}

export function AnalyticsSkeleton() {
  return (
    <PageWrap>
      <HeaderSkel />
      <TilesSkel n={4} />
      <ChartSkel h={320} />
      <div className="grid xl:grid-cols-2 gap-6">
        <ChartSkel h={260} />
        <ChartSkel h={260} />
      </div>
    </PageWrap>
  );
}

export function PerformanceSkeleton() {
  return (
    <PageWrap>
      <HeaderSkel />
      <TilesSkel n={4} />
      <ChartSkel h={340} />
    </PageWrap>
  );
}

export function PositionsSkeleton() {
  return (
    <PageWrap>
      <HeaderSkel hero />
      <TilesSkel n={4} />
      <TableSkel rows={8} cols={7} />
    </PageWrap>
  );
}

export function HistorySkeleton() {
  return (
    <PageWrap>
      <HeaderSkel />
      <TilesSkel n={4} />
      <TableSkel rows={12} cols={7} />
    </PageWrap>
  );
}

export function ScannerSkeleton() {
  return (
    <PageWrap>
      <HeaderSkel />
      <TilesSkel n={3} />
      <TableSkel rows={10} cols={6} />
    </PageWrap>
  );
}

export function MutualFundsSkeleton() {
  return (
    <PageWrap>
      <HeaderSkel />
      <TilesSkel n={3} />
      <TableSkel rows={8} cols={6} />
    </PageWrap>
  );
}

export function FundsSkeleton() {
  return (
    <PageWrap>
      <HeaderSkel />
      <TilesSkel n={3} />
      <CardsSkel n={2} />
    </PageWrap>
  );
}

export function PlaybookSkeleton() {
  return (
    <PageWrap>
      <HeaderSkel />
      <CardsSkel n={6} />
    </PageWrap>
  );
}

export function AlgoSignalsSkeleton() {
  return (
    <PageWrap>
      <HeaderSkel />
      <TilesSkel n={4} />
      <TableSkel rows={4} cols={2} />
      <TableSkel rows={8} cols={5} />
    </PageWrap>
  );
}
