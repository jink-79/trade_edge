import { NavLink } from "react-router-dom";

import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/features/auth/hooks/use-auth";
import { useMissingCount } from "@/features/accounts/hooks/use-accounts";
import { currentMonth } from "@/lib/format";
import { NAV_ITEMS, initialOf } from "./nav-items";
import { CountBadge } from "./count-badge";
import { PrivacyToggle } from "@/components/common/privacy-toggle";

const itemClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
    isActive
      ? "bg-primary/12 text-primary"
      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
  );

// Desktop sidebar: same destinations as the phone tab bar.
export function SideNav() {
  const { data: user } = useCurrentUser();
  const missing = useMissingCount(currentMonth());

  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-border bg-card/40 px-3 py-5 md:flex">
      <div className="flex items-center gap-2.5 pb-6 pl-3">
        <img src="/icon.svg" alt="" className="size-8" />
        <span className="flex-1 font-display text-lg font-semibold tracking-tight">Bolero</span>
        <PrivacyToggle />
      </div>

      <nav aria-label="Main" className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon, badge }) => (
          <NavLink key={to} to={to} end={to === "/"} className={itemClass}>
            <Icon className="size-5" strokeWidth={1.75} />
            <span className="flex-1">{label}</span>
            {badge === "missing" && <CountBadge count={missing} />}
          </NavLink>
        ))}
      </nav>

      <NavLink to="/profile" className={(s) => cn(itemClass(s), "mt-auto")}>
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold text-foreground">
          {initialOf(user?.fullName)}
        </span>
        <span className="min-w-0 truncate">{user?.fullName ?? "Profile"}</span>
      </NavLink>
    </aside>
  );
}
