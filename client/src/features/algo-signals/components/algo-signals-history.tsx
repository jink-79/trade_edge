import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useDailySignalHistory } from "../hooks/use-algo-signals";
import { AlgoSignalsDailyView } from "./algo-signals-daily-view";
import { fmtDate } from "./algo-signals-format";

// History browser: pick a date range, click a past day to load its full
// signal doc — for spot-checking past signals against what the market did
// afterward. `listDailySignals` already returns full docs, so no extra fetch
// is needed on select.
export function AlgoSignalsHistory() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const { data: docs = [], isLoading } = useDailySignalHistory({
    from: from || undefined,
    to: to || undefined,
    limit: 90,
  });

  const selectedDoc = useMemo(
    () => docs.find((d) => d.reference_date === selected) ?? null,
    [docs, selected],
  );

  return (
    <div className="space-y-6">
      <Card className="border-border/70 bg-card/70" style={{ boxShadow: "var(--shadow-card)" }}>
        <CardHeader>
          <CardTitle className="text-base" style={{ fontFamily: "var(--font-display)" }}>
            History
          </CardTitle>
          <CardDescription>
            Browse past days' signals to spot-check the engine against what the market did
            afterward.
          </CardDescription>
          <div className="flex flex-wrap items-end gap-4 pt-3">
            <div className="space-y-1.5">
              <Label htmlFor="algo-history-from" className="text-xs text-muted-foreground">
                From
              </Label>
              <Input
                id="algo-history-from"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="algo-history-to" className="text-xs text-muted-foreground">
                To
              </Label>
              <Input
                id="algo-history-to"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-40"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading history…</p>
          ) : docs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No signals in this range.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {docs.map((d) => (
                <Button
                  key={d.reference_date}
                  size="sm"
                  variant={selected === d.reference_date ? "default" : "outline"}
                  onClick={() =>
                    setSelected((cur) => (cur === d.reference_date ? null : d.reference_date))
                  }
                >
                  {fmtDate(d.reference_date)}
                  {d.exits?.length ? ` · ${d.exits.length} exit${d.exits.length > 1 ? "s" : ""}` : ""}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedDoc && <AlgoSignalsDailyView doc={selectedDoc} />}
    </div>
  );
}
