import { ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// Symbols the run skipped because their price data wasn't fresh — collapsed
// by default since it's secondary, but visible so pipeline gaps aren't hidden.
// A stale HELD position is a much bigger deal (flying blind on real money)
// than a stale candidate never taken, so those get pulled out into their own
// loud warning instead of hiding in the collapsed list with everything else.
export function AlgoSignalsStale({
  symbols,
  heldSymbols = [],
}: {
  symbols: string[];
  heldSymbols?: string[];
}) {
  if (symbols.length === 0) return null;

  const heldSet = new Set(heldSymbols);
  const staleHeld = symbols.filter((s) => heldSet.has(s));
  const staleOther = symbols.filter((s) => !heldSet.has(s));

  return (
    <div className="space-y-3">
      {staleHeld.length > 0 && (
        <Card className="border-destructive/40 bg-destructive/5" style={{ boxShadow: "var(--shadow-card)" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-destructive">
              ⚠ Stale data on a held position
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-destructive/80 mb-3">
              Today's scan couldn't get fresh price data for these — you're holding them but the
              close/mark you're seeing may be outdated.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {staleHeld.map((s) => (
                <span
                  key={s}
                  className="rounded-md px-2 py-0.5 text-[11px] ring-1 bg-destructive/15 text-destructive ring-destructive/40 font-medium"
                >
                  {s}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {staleOther.length > 0 && (
        <Card className="border-border/70 bg-card/70" style={{ boxShadow: "var(--shadow-card)" }}>
          <Collapsible>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="flex-row items-center justify-between cursor-pointer">
                <CardTitle className="flex items-center gap-2 text-sm">
                  Stale symbols
                  <span className="rounded-md px-2 py-0.5 text-[11px] ring-1 bg-muted text-muted-foreground ring-border">
                    {staleOther.length}
                  </span>
                </CardTitle>
                <ChevronDown className="size-4 text-muted-foreground" />
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">
                  Skipped this run — price data wasn't fresh. Not currently held.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {staleOther.map((s) => (
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
      )}
    </div>
  );
}
