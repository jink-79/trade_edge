import { Outlet } from "react-router-dom";

import { BottomNav } from "./bottom-nav";
import { SideNav } from "./side-nav";

// Phone: header + content + bottom tab bar.
// Desktop (md and up): sidebar on the left, content beside it.
export default function AppLayout() {
  return (
    <div className="flex min-h-dvh bg-background">
      <SideNav />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center gap-2.5 bg-background/85 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] backdrop-blur md:hidden">
          <img src="/icon.svg" alt="" className="size-8" />
          <span className="font-display text-lg font-semibold tracking-tight">Bolero</span>
        </header>

        <main className="mx-auto w-full max-w-md flex-1 px-4 pb-[calc(5rem+env(safe-area-inset-bottom))] md:max-w-3xl md:px-8 md:pb-10 md:pt-8">
          <Outlet />
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
