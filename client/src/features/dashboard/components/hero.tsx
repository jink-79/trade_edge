import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";

export function Hero() {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <span className="size-1.5 rounded-full bg-primary animate-pulse" />
          Live · Q2 performance
        </div>
        <h1 className="mt-2 text-3xl md:text-4xl font-semibold">
          Good morning, Aman.
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          You're up <span className="text-primary tabular">+18.4%</span> this
          quarter — best stretch since you started tracking.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="gap-2 border-border/70">
          <Filter className="size-3.5" /> Filters
        </Button>
        <Badge className="bg-primary/15 text-primary border border-primary/30 hover:bg-primary/15">
          Streak · 4 green days
        </Badge>
      </div>
    </div>
  );
}


