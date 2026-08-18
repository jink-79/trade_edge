import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// Symbols the run skipped because their price data wasn't fresh — collapsed
// by default since it's secondary, but visible so pipeline gaps aren't hidden.
export function AlgoSignalsStale({ symbols }: { symbols: string[] }) {
  if (symbols.length === 0) return null;

  return (
    <Card size="sm">
      <Collapsible>
        <CollapsibleTrigger className="w-full">
          <CardHeader className="flex-row items-center justify-between cursor-pointer">
            <CardTitle className="flex items-center gap-2 text-sm">
              Stale symbols
              <Badge variant="outline">{symbols.length}</Badge>
            </CardTitle>
            <ChevronDown className="size-4 text-muted-foreground" />
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {symbols.map((s) => (
                <Badge key={s} variant="secondary">
                  {s}
                </Badge>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
