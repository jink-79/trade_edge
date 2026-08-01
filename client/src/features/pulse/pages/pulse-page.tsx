import { PulseDashboard } from "../components/pulse-dashboard";

// Deep-link page for the Pulse view. In normal use the dashboard is shown inside
// the Signals / Signal Results pages based on the active strategy (Preferences).
export function PulsePage() {
  return (
    <div className="min-h-screen flex">
      <main className="flex-1 min-w-0">
        <PulseDashboard />
      </main>
    </div>
  );
}
