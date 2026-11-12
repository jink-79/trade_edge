import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { currentMonth, fmtINR, monthLabel } from "@/lib/format";
import type { Account } from "../types/accounts.types";
import { fmtPct, gainOf } from "../utils/gain";

export function AccountRow({ account }: { account: Account }) {
  const { latest } = account;
  const gain = gainOf(latest);
  const stale = latest && latest.month !== currentMonth();
  const sub = [account.institution, account.mfCategory].filter(Boolean).join(" · ");

  return (
    <Link
      to={`/accounts/${account.id}`}
      className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-secondary/60 active:bg-secondary"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{account.name}</p>
        {sub && <p className="truncate text-xs text-muted-foreground">{sub}</p>}
      </div>
      <div className="shrink-0 text-right">
        <p className="font-medium tabular-nums">{latest ? fmtINR(latest.value) : "—"}</p>
        {gain ? (
          <p className={cn("text-xs tabular-nums", gain.amount >= 0 ? "text-up" : "text-down")}>
            {fmtPct(gain.pct)}
            {stale && <span className="text-muted-foreground"> · {monthLabel(latest.month)}</span>}
          </p>
        ) : (
          stale && <p className="text-xs text-muted-foreground">{monthLabel(latest.month)}</p>
        )}
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
