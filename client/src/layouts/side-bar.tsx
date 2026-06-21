import {
  Activity,
  BarChart3,
  CalendarDays,
  ChevronRight,
  LayoutDashboard,
  LineChart,
  PiggyBank,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { Separator } from "@/components/ui/separator";

/* ─────────────────────────────────────────────
   NAV STRUCTURE
   Add / remove routes here — Sidebar and
   AppRoutes both read from this single source.
───────────────────────────────────────────── */

export const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Activity, label: "Open Positions", path: "/positions" },
  { icon: BarChart3, label: "Trade History", path: "/history" },
  { icon: LineChart, label: "Analytics", path: "/analytics" },
  { icon: PiggyBank, label: "Mutual Funds", path: "/mutual-funds" },
  { icon: Target, label: "Playbook", path: "/playbook" },
  { icon: CalendarDays, label: "Journal", path: "/journal" },
];

/* ─────────────────────────────────────────────
   SIDEBAR
───────────────────────────────────────────── */

export function Sidebar() {
  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-border/60 bg-sidebar/60 backdrop-blur-xl sticky top-0 h-screen">
      {/* Logo */}
      <div className="px-5 h-16 flex items-center gap-2.5 border-b border-border/60 shrink-0">
        <div className="size-8 rounded-lg grid place-items-center bg-primary/15 ring-1 ring-primary/30">
          <Zap className="size-4 text-primary" />
        </div>
        <div className="leading-tight">
          <div
            className="text-[15px] font-semibold tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Trade Edge
          </div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Performance OS
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="px-3 py-4 space-y-0.5 flex-1 overflow-y-auto">
        <p className="px-3 pb-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground/60">
          Menu
        </p>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              `group flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-all duration-150 ${
                isActive
                  ? "bg-accent/60 text-foreground ring-1 ring-border/80"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-3">
                  <item.icon
                    className={`size-4 shrink-0 transition-colors ${
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-foreground"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {isActive && (
                  <ChevronRight className="size-3 text-primary opacity-60" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Divider */}
      <div className="px-3">
        <Separator className="bg-border/50" />
      </div>

      {/* Edge AI insight */}
      <div className="p-4 shrink-0">
        <div className="rounded-xl p-3.5 border border-border/70 bg-card/60 space-y-2">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-md bg-primary/15 grid place-items-center">
              <Sparkles className="size-3.5 text-primary" />
            </div>
            <span className="text-xs font-semibold text-foreground">
              Edge AI
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Win rate drops 14% on Thursdays after 2 PM. Consider a midweek
            cooldown.
          </p>
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Live insight
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
