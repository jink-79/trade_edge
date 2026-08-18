import { AlgoSignalsDashboard } from "../components/algo-signals-dashboard";

export function AlgoSignalsPage() {
  return (
    <div className="min-h-screen flex">
      <main className="flex-1 min-w-0">
        <AlgoSignalsDashboard />
      </main>
    </div>
  );
}
