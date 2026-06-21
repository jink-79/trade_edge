import { NavLink } from "react-router-dom";
import { Home, Frown } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 px-8 text-center">
      <div className="size-14 rounded-2xl bg-accent/50 border border-border/70 grid place-items-center">
        <Frown className="size-7 text-muted-foreground" />
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Page not found
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground max-w-xs">
          This route doesn't exist yet. Check the URL or head back to the
          dashboard.
        </p>
      </div>
      <NavLink to="/">
        <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Home className="size-4" /> Back to Dashboard
        </Button>
      </NavLink>
    </div>
  );
}
