import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="algo-history-from">From</Label>
              <Input id="algo-history-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="algo-history-to">To</Label>
              <Input id="algo-history-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading history…</p>
          ) : docs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No signals in this range.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {docs.map((d) => (
                <button
                  key={d.reference_date}
                  type="button"
                  onClick={() => setSelected((cur) => (cur === d.reference_date ? null : d.reference_date))}
                >
                  <Badge
                    variant={selected === d.reference_date ? "default" : "outline"}
                    className="cursor-pointer"
                  >
                    {fmtDate(d.reference_date)}
                    {d.exits?.length ? ` · ${d.exits.length} exit${d.exits.length > 1 ? "s" : ""}` : ""}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedDoc && <AlgoSignalsDailyView doc={selectedDoc} />}
    </div>
  );
}
