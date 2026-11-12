import { Link } from "react-router-dom";
import { ArrowDownRight, ArrowUpRight, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { addMonths, currentMonth, fmtINR, longMonth, monthLabel } from "@/lib/format";
import { useAccounts, useAllSnapshots } from "@/features/accounts/hooks/use-accounts";
import { ASSET_TYPES, LIABILITY_TYPES } from "@/features/accounts/utils/account-meta";
import { fmtPct } from "@/features/accounts/utils/gain";
import { summarize, type NetWorthSummary } from "../utils/net-worth";
import { TrendChart } from "../components/trend-chart";
import { Breakdown } from "../components/breakdown";
import { usePossessions } from "@/features/possessions/hooks/use-possessions";
import { totals } from "@/features/possessions/utils/possession-value";

export function HomePage() {
  const accounts = useAccounts();
  const history = useAllSnapshots();

  if (accounts.isLoading || history.isLoading) {
    return (
      <div className="grid place-items-center py-24">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    );
  }

  if (accounts.isError || history.isError || !accounts.data || !history.data) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-sm text-muted-foreground">Couldn't load your net worth.</p>
        <Button
          variant="outline"
          onClick={() => {
            accounts.refetch();
            history.refetch();
          }}
        >
          Try again
        </Button>
      </div>
    );
  }

  if (accounts.data.length === 0) return <FirstRun />;

  return <Dashboard s={summarize(accounts.data, history.data, currentMonth())} />;
}

function Dashboard({ s }: { s: NetWorthSummary }) {
  const { data: items } = usePossessions();
  const possessions = items && items.length > 0 ? totals(items).worth : null;
  const { current, previous, missing, investments } = s;
  const change = previous ? current.net - previous.net : null;
  const changePct = previous && previous.net !== 0 ? (change! / Math.abs(previous.net)) * 100 : null;
  const up = (change ?? 0) >= 0;
  const gain = investments ? investments.value - investments.invested : 0;

  return (
    <div className="flex flex-col gap-5 pt-2 md:pt-0">
      {/* headline */}
      <section className="rounded-3xl border border-border bg-card p-5 md:p-6">
        <p className="text-sm text-muted-foreground">Net worth · {monthLabel(s.month)}</p>
        <p
          className={cn(
            "mt-2 text-[2.6rem] font-semibold leading-none tracking-tight tabular-nums md:text-5xl",
            current.net < 0 && "text-down",
          )}
        >
          {current.net < 0 ? "−" : ""}
          {fmtINR(Math.abs(current.net))}
        </p>
        {change !== null && change !== 0 && (
          <p className={cn("mt-3 inline-flex items-center gap-1 text-sm tabular-nums", up ? "text-up" : "text-down")}>
            {up ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
            {up ? "+" : "−"}
            {fmtINR(Math.abs(change))}
            {changePct !== null && ` (${fmtPct(changePct)})`}
            <span className="text-muted-foreground">since {longMonth(previous!.month)}</span>
          </p>
        )}
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4 text-sm">
          <div>
            <p className="text-muted-foreground">You own</p>
            <p className="mt-0.5 font-medium tabular-nums">{fmtINR(current.assets)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">You owe</p>
            <p className={cn("mt-0.5 font-medium tabular-nums", current.liabilities > 0 && "text-down")}>
              {current.liabilities > 0 ? "−" : ""}
              {fmtINR(current.liabilities)}
            </p>
          </div>
        </div>
      </section>

      {/* possessions: shown beside net worth, not inside it */}
      {possessions !== null && (
        <Link
          to="/possessions"
          className="flex items-center gap-3 rounded-3xl border border-border bg-card px-5 py-4 transition-colors hover:bg-secondary/60"
        >
          <span className="size-2.5 shrink-0 rounded-full bg-cat-possessions" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm text-muted-foreground">With possessions</span>
            <span className="block font-semibold tabular-nums">{fmtINR(current.net + possessions)}</span>
          </span>
          <span className="text-right">
            <span className="block text-sm text-muted-foreground">Possessions</span>
            <span className="block font-medium tabular-nums">+{fmtINR(possessions)}</span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </Link>
      )}

      {/* monthly update prompt */}
      {missing.length > 0 && (
        <section className="flex items-center gap-4 rounded-3xl bg-primary/12 p-5">
          <div className="min-w-0 flex-1">
            <p className="font-semibold">
              {missing.length} {missing.length === 1 ? "account needs" : "accounts need"} {longMonth(s.month)}
            </p>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              Using last month's value for now · {missing.map((a) => a.name).join(", ")}
            </p>
          </div>
          <Button asChild className="h-11 shrink-0 rounded-2xl px-5 text-[15px]">
            <Link to="/accounts">Update</Link>
          </Button>
        </section>
      )}

      {/* trend */}
      <section className="rounded-3xl border border-border bg-card p-5">
        <h2 className="mb-4 text-lg font-semibold">
          {s.trend.length > 1 ? `Last ${s.trend.length} months` : "Trend"}
        </h2>
        {s.trend.length > 1 ? (
          <TrendChart points={s.trend} />
        ) : (
          <p className="text-sm text-muted-foreground">
            Your trend line appears once you have two months of values, after you update in{" "}
            {longMonth(addMonths(s.month, 1))}.
          </p>
        )}
      </section>

      {/* investments */}
      {investments && (
        <section className="grid grid-cols-3 gap-3 rounded-3xl border border-border bg-card p-5 text-sm">
          <div>
            <p className="text-muted-foreground">Invested</p>
            <p className="mt-0.5 font-medium tabular-nums">{fmtINR(investments.invested)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Worth now</p>
            <p className="mt-0.5 font-medium tabular-nums">{fmtINR(investments.value)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Gain</p>
            <p className={cn("mt-0.5 font-medium tabular-nums", gain >= 0 ? "text-up" : "text-down")}>
              {fmtPct((gain / investments.invested) * 100)}
            </p>
          </div>
        </section>
      )}

      <div className="flex flex-col gap-8 px-1 pt-3">
        <Breakdown title="What you own" total={current.assets} types={ASSET_TYPES} byType={s.byType} />
        <Breakdown title="What you owe" total={current.liabilities} types={LIABILITY_TYPES} byType={s.byType} owed />
      </div>
    </div>
  );
}

function FirstRun() {
  return (
    <div className="flex flex-col gap-5 pt-2 md:pt-0">
      <section className="rounded-3xl border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">Net worth</p>
        <p className="mt-2 text-[2.6rem] font-semibold leading-none tracking-tight text-muted-foreground tabular-nums">
          ₹0
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Add your mutual funds, stocks, bank accounts, loans and credit cards. Bolero adds them up into one number and
          tracks it month by month.
        </p>
        <Button asChild className="mt-5 h-11 gap-2 rounded-2xl px-5 text-[15px]">
          <Link to="/accounts">
            <Plus className="size-4" /> Add your first account
          </Link>
        </Button>
      </section>
    </div>
  );
}
