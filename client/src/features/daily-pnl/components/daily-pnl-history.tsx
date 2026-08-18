import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useDailyPnlHistory } from "../hooks/use-daily-pnl";
import { DailyPnlSnapshotView } from "./daily-pnl-snapshot-view";
import { fmtDate, fmtSigned } from "./daily-pnl-format";

export function DailyPnlHistory() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const { data: snapshots = [], isLoading } = useDailyPnlHistory({
    from: from || undefined,
    to: to || undefined,
    limit: 90,
  });

  const selectedSnapshot = useMemo(
    () => snapshots.find((s) => s.date === selected) ?? null,
    [snapshots, selected],
  );

  return (
    <div className="space-y-6">
      <Card className="border-border/70 bg-card/70" style={{ boxShadow: "var(--shadow-card)" }}>
        <CardHeader>
          <CardTitle className="text-base" style={{ fontFamily: "var(--font-display)" }}>
            History
          </CardTitle>
          <CardDescription>Browse past days' P&amp;L snapshots.</CardDescription>
          <div className="flex flex-wrap items-end gap-4 pt-3">
            <div className="space-y-1.5">
              <Label htmlFor="pnl-history-from" className="text-xs text-muted-foreground">
                From
              </Label>
              <Input
                id="pnl-history-from"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pnl-history-to" className="text-xs text-muted-foreground">
                To
              </Label>
              <Input
                id="pnl-history-to"
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
          ) : snapshots.length === 0 ? (
            <p className="text-sm text-muted-foreground">No snapshots in this range.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {snapshots.map((s) => (
                <Button
                  key={s.date}
                  size="sm"
                  variant={selected === s.date ? "default" : "outline"}
                  onClick={() => setSelected((cur) => (cur === s.date ? null : s.date))}
                >
                  {fmtDate(s.date)} · {fmtSigned(s.totalPnl)}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedSnapshot && <DailyPnlSnapshotView snapshot={selectedSnapshot} />}
    </div>
  );
}
