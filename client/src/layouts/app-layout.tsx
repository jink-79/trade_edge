import { Outlet } from "react-router-dom";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLogout } from "@/features/auth/hooks/use-auth";

// Mobile-first shell: a single centered column, no sidebar.
export default function AppLayout() {
  const logout = useLogout();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur">
        <span className="text-base font-semibold tracking-tight">Net Worth</span>
        <Button variant="ghost" size="icon" onClick={logout} aria-label="Log out">
          <LogOut className="size-4" />
        </Button>
      </header>

      <main className="flex-1 px-4 pb-[env(safe-area-inset-bottom)]">
        <Outlet />
      </main>
    </div>
  );
}
