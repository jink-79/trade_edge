import { useDashboard } from "../hooks/use-dashboard";
import { useCurrentUser } from "@/features/auth/hooks/use-auth";
import { AllocationCard } from "../components/allocation-card";
import { EquityCard } from "../components/equity-card";
import { Hero } from "../components/hero";
import { KpiGrid } from "../components/kpi-grid";
import { PnlByDayCard } from "../components/pnl-by-day-card";
import { RecentTrades } from "../components/recent-trades";
import { SetupsCard } from "../components/setups-card";
import { DashboardSkeleton } from "@/components/page-skeletons";

export function Dashboard() {
  const { data, isLoading } = useDashboard();
  const { data: user } = useCurrentUser();

  if (isLoading || !data) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen flex">
      <main className="flex-1 min-w-0">
        <div className="px-8 py-8 space-y-8 max-w-[1600px]">
          <Hero
            userName={user?.fullName}
            portfolio={data.portfolio}
            tradeStats={data.tradeStats}
          />
          <KpiGrid
            stats={data.tradeStats}
            portfolio={data.portfolio}
            positions={data.positions}
          />
          <div className="grid grid-cols-12 gap-6">
            <EquityCard
              pnlChart={data.pnlChart}
              portfolio={data.portfolio}
              netPnl={data.tradeStats.netPnl}
            />
            <AllocationCard portfolio={data.portfolio} />
          </div>
          <div className="grid grid-cols-12 gap-6">
            <PnlByDayCard pnlChart={data.pnlChart} />
            <SetupsCard setups={data.setups} />
          </div>
          <RecentTrades trades={data.recentTrades} />
        </div>
      </main>
    </div>
  );
}
