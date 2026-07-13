import { Star, Tag, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { type Setup } from "../types/playbook.types";
import { biasStyles, statusStyles } from "../utils/playbook-utils";
import { PlaybookStat } from "./playbook-stat";

interface SetupRowProps {
  setup: Setup;
  active: boolean;
  onClick: () => void;
}

export function SetupRow({ setup, active, onClick }: SetupRowProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group w-full rounded-xl border bg-card/60 p-5 text-left transition-all hover:border-primary/40 hover:bg-card",
        active
          ? "border-primary/50 ring-1 ring-primary/30"
          : "border-border/60",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {setup.pinned && (
              <Star className="size-3.5 fill-warning text-warning" />
            )}
            <h3 className="truncate text-sm font-semibold text-foreground">
              {setup.name}
            </h3>
            <span className="font-mono text-[10px] text-muted-foreground">
              {setup.tag}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {setup.description}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Badge
            variant="outline"
            className={cn("gap-1 text-[10px]", statusStyles[setup.status])}
          >
            <span className="size-1.5 rounded-full bg-current" />
            {setup.status}
          </Badge>
          <Badge
            variant="outline"
            className={cn("text-[10px]", biasStyles[setup.bias])}
          >
            {setup.bias}
          </Badge>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-3 border-t border-border/50 pt-3">
        <PlaybookStat label="Trades" value={String(setup.trades)} />
        <PlaybookStat
          label="Win"
          value={setup.trades ? `${setup.winRate.toFixed(1)}%` : "—"}
          tone={setup.winRate >= 55 ? "success" : "default"}
        />
        <PlaybookStat
          label="Avg R"
          value={setup.trades ? setup.avgR.toFixed(2) : "—"}
          tone={setup.avgR >= 1.5 ? "success" : "default"}
        />
        <PlaybookStat
          label="Max DD"
          value={setup.trades ? `${setup.maxDD.toFixed(1)}%` : "—"}
          tone="muted"
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Tag className="size-3" /> {setup.category}
          <span className="mx-1 text-border">·</span>
          <Clock className="size-3" /> {setup.timeframe}
        </span>
        <span>Last: {setup.lastUsed}</span>
      </div>
    </button>
  );
}
