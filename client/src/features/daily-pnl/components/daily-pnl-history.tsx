import { useMemo, useState } from "react";
import { CalendarIcon, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDailyPnlHistory } from "../hooks/use-daily-pnl";
import { DailyPnlSnapshotView } from "./daily-pnl-snapshot-view";
import { fmtDate, fmtSigned } from "./daily-pnl-format";

const isoToLocalDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
};
const dateToISO = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

function DateFilterField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (iso: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-1">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-40 justify-start font-normal tabular text-foreground">
              <CalendarIcon className="size-3.5 text-muted-foreground" />
              {value ? fmtDate(value) : "Any"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={value ? isoToLocalDate(value) : undefined}
              onSelect={(d) => d && onChange(dateToISO(d))}
              disabled={{ after: new Date() }}
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
        {value && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground"
            onClick={() => onChange("")}
          >
            <X className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

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
            <DateFilterField label="From" value={from} onChange={setFrom} />
            <DateFilterField label="To" value={to} onChange={setTo} />
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
