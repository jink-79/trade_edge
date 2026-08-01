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
import { fmtPct, fmtNum } from "./pulse-format";
import type { PulsePerformance } from "../types/pulse.types";

export function PulseVariants({
  variants,
  selected,
  onSelect,
}: {
  variants: PulsePerformance[];
  selected?: string | null;
  onSelect: (v: string) => void;
}) {
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
          Variants
        </CardTitle>
        <CardDescription>
          Baseline v10 vs filtered experiments — click a row to view its curve.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Variant</TableHead>
                <TableHead className="text-right">Trades</TableHead>
                <TableHead className="text-right">CAGR</TableHead>
                <TableHead className="text-right">Max DD</TableHead>
                <TableHead className="text-right">Sharpe</TableHead>
                <TableHead className="text-right">Win%</TableHead>
                <TableHead className="text-right">Alpha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variants.map((v) => {
                const m = v.metrics;
                const isSel = selected === v.variant;
                return (
                  <TableRow
                    key={v.variant}
                    onClick={() => onSelect(v.variant)}
                    className={`cursor-pointer ${isSel ? "bg-accent/50" : ""}`}
                  >
                    <TableCell className="font-medium">
                      {v.label ?? v.variant}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {m?.trades ?? "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmtPct(m?.cagrPct)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-destructive">
                      {fmtPct(m?.maxDrawdownPct)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmtNum(m?.sharpe)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmtPct(m?.winRatePct)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {m?.alphaPct != null ? `${m.alphaPct.toFixed(1)}pp` : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
