import { AllocationCard } from "../components/allocation-card";
import { EquityCard } from "../components/equity-card";
import { Hero } from "../components/hero";
import { KpiGrid } from "../components/kpi-grid";
import { PnlByDayCard } from "../components/pnl-by-day-card";
import { RecentTrades } from "../components/recent-trades";
import { SetupsCard } from "../components/setups-card";

export function Dashboard() {
  return (
    <div className="min-h-screen flex">
      <main className="flex-1 min-w-0">
        <div className="px-8 py-8 space-y-8 max-w-[1600px]">
          <Hero />
          <KpiGrid />
          <div className="grid grid-cols-12 gap-6">
            <EquityCard />
            <AllocationCard />
          </div>
          <div className="grid grid-cols-12 gap-6">
            <PnlByDayCard />
            <SetupsCard />
          </div>
          <RecentTrades />
        </div>
      </main>
    </div>
  );
}
