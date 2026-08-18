import { useLatestDailyPnl } from "../hooks/use-daily-pnl";
import { DailyPnlDashboard } from "../components/daily-pnl-dashboard";
import { DailyPnlSkeleton } from "@/components/page-skeletons";

export function DailyPnlPage() {
  const { isLoading } = useLatestDailyPnl();

  if (isLoading) {
    return <DailyPnlSkeleton />;
  }

  return (
    <div className="min-h-screen flex">
      <main className="flex-1 min-w-0">
        <DailyPnlDashboard />
      </main>
    </div>
  );
}
