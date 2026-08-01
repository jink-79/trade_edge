import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fmtNum, fmtRs } from "./pulse-format";
import type { PulseRun } from "../types/pulse.types";

const CAPS = ["All", "Largecap", "Midcap", "Smallcap"] as const;

export function PulseSignalsTable({ run }: { run: PulseRun }) {
  const [cap, setCap] = useState<string>("All");
  const [sector, setSector] = useState<string>("All");
  const [takenOnly, setTakenOnly] = useState(false);

  const sectors = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          run.candidates.map((c) => c.sector).filter(Boolean) as string[],
        ),
      ).sort(),
    ],
    [run],
  );

  const rows = useMemo(
    () =>
      run.candidates.filter(
        (c) =>
          (cap === "All" || c.marketCap === cap) &&
          (sector === "All" || c.sector === sector) &&
          (!takenOnly || c.taken),
      ),
    [run, cap, sector, takenOnly],
  );

  return (
    <Card
      className="border-border/70 bg-card/70"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <CardHeader>
        <CardTitle
          className="text-base"
          style={{ fontFamily: "var(--font-display)" }}
        >
          This week's signals · {run.candidates.length} fired,{" "}
          {run.candidates.filter((c) => c.taken).length} taken
        </CardTitle>
        <CardDescription>
          v10 entries on the {run.asOf?.slice(0, 10)} weekly close, RS-ranked.
          Top {run.freeSlots} fit the 12-cap + cash. Prices are estimates off the
          signal-week close (fill = Monday open).
        </CardDescription>
        <div className="flex flex-wrap items-center gap-2 pt-3">
          {CAPS.map((c) => (
            <Button
              key={c}
              size="sm"
              variant={cap === c ? "default" : "outline"}
              onClick={() => setCap(c)}
            >
              {c}
            </Button>
          ))}
          <select
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="h-8 rounded-md border border-border/70 bg-background px-2 text-sm"
          >
            {sectors.map((s) => (
              <option key={s} value={s}>
                {s === "All" ? "All sectors" : s}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            variant={takenOnly ? "default" : "outline"}
            onClick={() => setTakenOnly((v) => !v)}
          >
            Taken only
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead>Sector</TableHead>
                <TableHead>Cap</TableHead>
                <TableHead className="text-right">RS-55</TableHead>
                <TableHead className="text-right">Close</TableHead>
                <TableHead className="text-right">ATR</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Est SL</TableHead>
                <TableHead className="text-right">Est Target</TableHead>
                <TableHead className="text-right">Take</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={11}
                    className="text-center text-muted-foreground py-8"
                  >
                    No signals match these filters.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((c) => (
                  <TableRow key={c.symbol} className={c.taken ? "" : "opacity-70"}>
                    <TableCell className="text-muted-foreground tabular-nums">
                      {c.rank}
                    </TableCell>
                    <TableCell className="font-medium">{c.symbol}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.sector ?? "—"}
                    </TableCell>
                    <TableCell>
                      {c.marketCap ? (
                        <Badge variant="secondary">{c.marketCap}</Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmtNum(c.rs55, 3)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmtRs(c.close)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmtNum(c.atr)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {c.shares ?? "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-destructive">
                      {fmtRs(c.estSl)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-primary">
                      {fmtRs(c.estTarget)}
                    </TableCell>
                    <TableCell className="text-right">
                      {c.taken ? (
                        <Badge className="bg-primary/15 text-primary">BUY</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
