import { useMemo } from "react";
import {
  useScannerSignals,
  useScannerStats,
} from "@/features/scanner/hooks/use-scanner";
import { ScannerHero } from "@/features/scanner/components/scanner-hero";
import { ScannerPasteCard } from "@/features/scanner/components/scanner-paste-card";
import { ScannerUploadCard } from "@/features/scanner/components/scanner-upload-card";
import { ScannerKpis } from "@/features/scanner/components/scanner-kpis";
import { ActiveSignalsTable } from "@/features/scanner/components/active-signals-table";
import { ResolvedSignalsTable } from "@/features/scanner/components/resolved-signals-table";
import { ScannerSkeleton } from "@/components/page-skeletons";

export function ScannerPage() {
  const { data: signals = [], isLoading } = useScannerSignals();
  const { data: stats } = useScannerStats();

  const active = useMemo(
    () => signals.filter((s) => s.status === "OPEN"),
    [signals],
  );
  const resolved = useMemo(
    () => signals.filter((s) => s.status !== "OPEN"),
    [signals],
  );

  if (isLoading) {
    return <ScannerSkeleton />;
  }

  return (
    <div className="min-h-screen flex">
      <main className="flex-1 min-w-0">
        <div className="px-8 py-8 space-y-8 max-w-[1600px]">
          <ScannerHero tracking={active.length} resolved={resolved.length} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ScannerPasteCard />
            <ScannerUploadCard />
          </div>
          {stats && <ScannerKpis stats={stats} />}
          <ActiveSignalsTable signals={active} />
          <ResolvedSignalsTable signals={resolved} />
        </div>
      </main>
    </div>
  );
}
