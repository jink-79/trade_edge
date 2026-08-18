import { ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// Symbols the run skipped because their price data wasn't fresh — collapsed
// by default since it's secondary, but visible so pipeline gaps aren't hidden.
export function AlgoSignalsStale({ symbols }: { symbols: string[] }) {
  if (symbols.length === 0) return null;

  return (
    <Card className="border-border/70 bg-card/70" style={{ boxShadow: "var(--shadow-card)" }}>
      <Collapsible>
        <CollapsibleTrigger className="w-full">
          <CardHeader className="flex-row items-center justify-between cursor-pointer">
            <CardTitle className="flex items-center gap-2 text-sm">
              Stale symbols
              <span className="rounded-md px-2 py-0.5 text-[11px] ring-1 bg-muted text-muted-foreground ring-border">
                {symbols.length}
              </span>
            </CardTitle>
            <ChevronDown className="size-4 text-muted-foreground" />
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Skipped this run — price data wasn't fresh.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {symbols.map((s) => (
                <span
                  key={s}
                  className="rounded-md px-2 py-0.5 text-[11px] ring-1 bg-accent/60 text-foreground ring-border/70"
                >
                  {s}
                </span>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
