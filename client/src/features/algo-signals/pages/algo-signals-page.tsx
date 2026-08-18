import { useLatestDailySignal } from "../hooks/use-algo-signals";
import { AlgoSignalsDashboard } from "../components/algo-signals-dashboard";
import { AlgoSignalsSkeleton } from "@/components/page-skeletons";

export function AlgoSignalsPage() {
  const { isLoading } = useLatestDailySignal();

  if (isLoading) {
    return <AlgoSignalsSkeleton />;
  }

  return (
    <div className="min-h-screen flex">
      <main className="flex-1 min-w-0">
        <AlgoSignalsDashboard />
      </main>
    </div>
  );
}
