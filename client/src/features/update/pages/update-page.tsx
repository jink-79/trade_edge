import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { addMonths, currentMonth, monthLabel } from "@/lib/format";
import { useAccounts, useAllSnapshots } from "@/features/accounts/hooks/use-accounts";
import { MonthForm } from "../components/month-form";

export function UpdatePage() {
  const [month, setMonth] = useState(currentMonth());
  const accounts = useAccounts();
  const history = useAllSnapshots();
  const isCurrent = month === currentMonth();

  return (
    <>
      <div className="flex items-center justify-between gap-3 pb-5 pt-2 md:pt-0">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Update</h1>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-lg" aria-label="Previous month" onClick={() => setMonth(addMonths(month, -1))}>
            <ChevronLeft className="size-5" />
          </Button>
          <span className="min-w-24 text-center font-medium">{monthLabel(month)}</span>
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label="Next month"
            disabled={isCurrent}
            onClick={() => setMonth(addMonths(month, 1))}
          >
            <ChevronRight className="size-5" />
          </Button>
        </div>
      </div>

      {(accounts.isLoading || history.isLoading) && (
        <div className="grid place-items-center py-16">
          <Spinner className="size-6 text-muted-foreground" />
        </div>
      )}

      {(accounts.isError || history.isError) && (
        <p className="py-12 text-center text-sm text-muted-foreground">Couldn't load your accounts.</p>
      )}

      {accounts.data && history.data && accounts.data.length === 0 && (
        <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-border p-6">
          <p className="font-medium">No accounts yet</p>
          <p className="text-sm text-muted-foreground">Add your accounts first. Each month you'll update them all here.</p>
          <Button asChild className="h-11 rounded-xl px-5">
            <Link to="/accounts">Go to Accounts</Link>
          </Button>
        </div>
      )}

      {accounts.data && history.data && accounts.data.length > 0 && (
        // keyed by month so every switch starts from that month's saved values
        <MonthForm key={month} month={month} accounts={accounts.data} rows={history.data} />
      )}
    </>
  );
}
