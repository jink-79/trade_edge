import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { fmtINR } from "@/lib/format";
import { TYPE_META } from "@/features/accounts/utils/account-meta";
import type { AccountType } from "@/features/accounts/types/accounts.types";

interface Props {
  title: string;
  total: number;
  types: AccountType[];
  byType: Record<AccountType, number>;
  owed?: boolean;
}

// One bar per category, sized by its share of the section total.
export function Breakdown({ title, total, types, byType, owed }: Props) {
  const rows = types.filter((t) => byType[t] > 0).sort((a, b) => byType[b] - byType[a]);
  if (rows.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className={cn("font-semibold tabular-nums", owed && "text-down")}>
          {owed ? "−" : ""}
          {fmtINR(total)}
        </span>
      </div>
      <div className="flex flex-col gap-4">
        {rows.map((t) => {
          const meta = TYPE_META[t];
          const share = total > 0 ? (byType[t] / total) * 100 : 0;
          return (
            <Link key={t} to="/accounts" className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-3">
                <span className="flex items-center gap-2">
                  {meta.group}
                  <span className="text-xs text-muted-foreground tabular-nums">{Math.round(share)}%</span>
                </span>
                <span className="tabular-nums">{fmtINR(byType[t])}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div className={cn("h-full rounded-full", meta.dot)} style={{ width: `${Math.max(share, 2)}%` }} />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
