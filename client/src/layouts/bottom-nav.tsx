import { NavLink } from "react-router-dom";

import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/features/auth/hooks/use-auth";
import { NAV_ITEMS, initialOf } from "./nav-items";

const tabClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex flex-1 flex-col items-center gap-1 pt-2.5 pb-1 text-[11px] font-medium transition-colors",
    isActive ? "text-primary" : "text-muted-foreground active:text-foreground",
  );

// Phone tab bar, fixed to the bottom and clear of the home indicator.
export function BottomNav() {
  const { data: user } = useCurrentUser();

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-20 flex border-t border-border bg-card/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to} end={to === "/"} className={tabClass}>
          <Icon className="size-6" strokeWidth={1.75} />
          {label}
        </NavLink>
      ))}
      <NavLink to="/profile" className={tabClass}>
        {({ isActive }) => (
          <>
            <span
              className={cn(
                "grid size-6 place-items-center rounded-full text-[11px] font-semibold",
                isActive ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground",
              )}
            >
              {initialOf(user?.fullName)}
            </span>
            Profile
          </>
        )}
      </NavLink>
    </nav>
  );
}
