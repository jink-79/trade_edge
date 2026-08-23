import { useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Search, Trash2, Wallet } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { StatementEntry, StatementEntryType } from "../types/funds.types";

const fmtINR = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const TYPE_FILTERS: Array<StatementEntryType | "all"> = ["all", "deposit", "buy", "sell"];
const TYPE_LABEL: Record<StatementEntryType, string> = {
  deposit: "Deposit",
  buy: "Buy",
  sell: "Sell",
};

function TypeIcon({ type }: { type: StatementEntryType }) {
  if (type === "deposit") {
    return (
      <div className="size-8 rounded-lg grid place-items-center bg-primary/10 text-primary ring-1 ring-primary/25 shrink-0">
        <Wallet className="size-3.5" />
      </div>
    );
  }
  if (type === "buy") {
    return (
      <div className="size-8 rounded-lg grid place-items-center bg-destructive/10 text-destructive ring-1 ring-destructive/25 shrink-0">
        <ArrowUpRight className="size-3.5" />
      </div>
    );
  }
  return (
    <div className="size-8 rounded-lg grid place-items-center bg-primary/10 text-primary ring-1 ring-primary/25 shrink-0">
      <ArrowDownLeft className="size-3.5" />
    </div>
  );
}

export function FundsStatementTable({
  entries,
  onDeleteDeposit,
}: {
  entries: StatementEntry[];
  onDeleteDeposit?: (fundId: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<StatementEntryType | "all">("all");

  const filtered = useMemo(() => {
    let rows = entries;
    if (typeFilter !== "all") rows = rows.filter((e) => e.type === typeFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(
        (e) =>
          e.description.toLowerCase().includes(q) ||
          (e.symbol ?? "").toLowerCase().includes(q),
      );
    }
    return rows;
  }, [entries, search, typeFilter]);

  return (
    <Card className="border-border/70 bg-card/70" style={{ boxShadow: "var(--shadow-card)" }}>
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3 space-y-0 pb-4">
        <div>
          <CardTitle className="text-base font-semibold">Statement</CardTitle>
          <CardDescription>
            {filtered.length} entr{filtered.length === 1 ? "y" : "ies"} — every deposit,
            buy and sell, chronologically, with your running balance.
          </CardDescription>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 rounded-lg bg-secondary/50 p-1 border border-border/60">
            {TYPE_FILTERS.map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-medium capitalize transition-all",
                  typeFilter === t
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search symbol or note…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 w-48 text-sm bg-secondary/50 border-border/60"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-0 pb-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-border/60 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                <th className="text-left font-medium py-3 pl-6 pr-3">Date</th>
                <th className="text-left font-medium py-3 px-3">Particulars</th>
                <th className="text-right font-medium py-3 px-3">Debit</th>
                <th className="text-right font-medium py-3 px-3">Credit</th>
                <th className="text-right font-medium py-3 pl-3 pr-3">Balance</th>
                {onDeleteDeposit && <th className="w-10 pr-6" />}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={onDeleteDeposit ? 6 : 5}
                    className="py-16 text-center text-muted-foreground text-sm border-t border-border/60"
                  >
                    {entries.length === 0
                      ? "No activity yet — add a deposit or log a trade to see it here."
                      : "No entries match your filters."}
                  </td>
                </tr>
              )}
              {filtered.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-t border-border/60 hover:bg-accent/20 transition-colors"
                >
                  <td className="py-3.5 pl-6 pr-3 tabular text-muted-foreground whitespace-nowrap align-top">
                    {fmtDate(entry.date)}
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="flex items-start gap-2.5">
                      <TypeIcon type={entry.type} />
                      <div className="leading-tight">
                        <div className="font-medium">{entry.description}</div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Badge
                            variant="outline"
                            className="h-4 px-1.5 text-[9px] font-normal border-border/60 text-muted-foreground"
                          >
                            {TYPE_LABEL[entry.type]}
                          </Badge>
                          {entry.type === "sell" && entry.pnl != null && (
                            <Badge
                              className={cn(
                                "h-4 px-1.5 text-[9px] font-normal border",
                                entry.pnl >= 0
                                  ? "bg-primary/10 text-primary border-primary/30"
                                  : "bg-destructive/10 text-destructive border-destructive/30",
                              )}
                            >
                              {entry.pnl >= 0 ? "Profit " : "Loss "}
                              {entry.pnl >= 0 ? "+" : "−"}
                              {fmtINR(Math.abs(entry.pnl))}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-right tabular align-top">
                    {entry.debit != null ? (
                      <span className="text-destructive">{fmtINR(entry.debit)}</span>
                    ) : (
                      <span className="text-muted-foreground/40">—</span>
                    )}
                  </td>
                  <td className="py-3.5 px-3 text-right tabular align-top">
                    {entry.credit != null ? (
                      <span className="text-primary">{fmtINR(entry.credit)}</span>
                    ) : (
                      <span className="text-muted-foreground/40">—</span>
                    )}
                  </td>
                  <td className="py-3.5 pl-3 pr-3 text-right tabular font-medium align-top">
                    {fmtINR(entry.balance)}
                  </td>
                  {onDeleteDeposit && (
                    <td className="py-3.5 pr-6 align-top">
                      {entry.refId && (
                        <button
                          onClick={() => onDeleteDeposit(entry.refId as string)}
                          className="size-7 rounded-md grid place-items-center text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
