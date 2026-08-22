import { useState } from "react";
import { useTheme } from "next-themes";
import {
  Bell,
  LogOut,
  Moon,
  Settings,
  Sun,
  User,
  Menu,
  X,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NAV_ITEMS } from "./side-bar";
import { GlobalSearch } from "./global-search";
import { useCurrentUser, useLogout } from "@/features/auth/hooks/use-auth";

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "TE";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

/* ─────────────────────────────────────────────
   TOPBAR
───────────────────────────────────────────── */

export function Topbar() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { data: user } = useCurrentUser();
  const logout = useLogout();
  const { theme, setTheme } = useTheme();
  const isDark = theme !== "light";

  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

  return (
    <>
      <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b border-border/60 bg-background/70 px-5 backdrop-blur-xl lg:px-8">
        {/* Mobile: hamburger */}
        <button
          className="lg:hidden flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors"
          onClick={() => setMobileNavOpen((v) => !v)}
          aria-label="Toggle navigation"
        >
          {mobileNavOpen ? (
            <X className="size-4" />
          ) : (
            <Menu className="size-4" />
          )}
        </button>

        <GlobalSearch />

        {/* Right actions */}
        <div className="ml-auto flex items-center gap-1">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative size-9 text-muted-foreground hover:text-foreground"
          >
            <Bell className="size-4" />
            <span className="absolute right-2 top-2 size-1.5 rounded-full bg-destructive ring-1 ring-background" />
          </Button>

          {/* Settings */}
          <Button
            variant="ghost"
            size="icon"
            className="size-9 text-muted-foreground hover:text-foreground"
          >
            <Settings className="size-4" />
          </Button>

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="size-9 text-muted-foreground hover:text-foreground"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>

          {/* Divider */}
          <div className="mx-1 h-5 w-px bg-border/60" />

          {/* Avatar / profile dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex size-8 items-center justify-center rounded-full text-[11px] font-semibold text-primary-foreground ring-2 ring-background hover:brightness-110 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.78 0.17 155), oklch(0.68 0.18 240))",
                }}
              >
                {user ? initialsOf(user.fullName) : "TE"}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-medium">
                  {user?.fullName ?? "Trade Edge"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user?.email ?? "tradeedge.app"}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer gap-2 text-sm">
                <User className="size-3.5" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer gap-2 text-sm">
                <Settings className="size-3.5" /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={logout}
                className="cursor-pointer gap-2 text-sm text-destructive focus:text-destructive"
              >
                <LogOut className="size-3.5" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* ── MOBILE NAV DRAWER ── */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

          {/* Drawer */}
          <nav
            className="absolute left-0 top-16 bottom-0 w-64 bg-sidebar border-r border-border/60 flex flex-col py-4 gap-0.5 px-3 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {NAV_ITEMS.map((item: any) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                onClick={() => setMobileNavOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    isActive
                      ? "bg-accent/60 text-foreground ring-1 ring-border/80"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={`size-4 shrink-0 ${isActive ? "text-primary" : ""}`}
                    />
                    {item.label}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
