import { useEffect, useRef, useState } from "react";
import {
  Bell,
  Command,
  LogOut,
  Moon,
  Search,
  Settings,
  Sun,
  User,
  Menu,
  X,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NAV_ITEMS } from "./side-bar";

/* ─────────────────────────────────────────────
   TOPBAR
───────────────────────────────────────────── */

export function Topbar() {
  const searchRef = useRef<HTMLInputElement | null>(null);
  const [isDark, setIsDark] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  /* Sync theme on mount */
  useEffect(() => {
    setIsDark(!document.documentElement.classList.contains("light"));
  }, []);

  /* ⌘K / Ctrl+K focuses search */
  useEffect(() => {
    const handle = (e: any) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.remove("light");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.add("light");
      localStorage.setItem("theme", "light");
    }
  };

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

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchRef}
            placeholder="Search trades, tickers, setups…"
            className="h-9 bg-secondary/50 border-border/60 pl-9 pr-16 text-sm"
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 rounded border border-border/60 bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            <Command className="size-3" />K
          </kbd>
        </div>

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
                AK
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-medium">Ajinkya</p>
                <p className="text-xs text-muted-foreground">tradeedge.app</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer gap-2 text-sm">
                <User className="size-3.5" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer gap-2 text-sm">
                <Settings className="size-3.5" /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer gap-2 text-sm text-destructive focus:text-destructive">
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
