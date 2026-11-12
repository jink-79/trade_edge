import { Download, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/page-header";
import { useCurrentUser, useLogout } from "@/features/auth/hooks/use-auth";
import { useAccounts, useAllSnapshots } from "@/features/accounts/hooks/use-accounts";
import { TYPE_META } from "@/features/accounts/utils/account-meta";
import { usePossessions } from "@/features/possessions/hooks/use-possessions";
import { CATEGORY_META } from "@/features/possessions/utils/possession-meta";
import { valueNow } from "@/features/possessions/utils/possession-value";
import { currentMonth } from "@/lib/format";
import { downloadText, toCsv } from "@/lib/csv";
import { initialOf } from "@/layouts/nav-items";

export function ProfilePage() {
  const { data: user } = useCurrentUser();
  const logout = useLogout();
  const accounts = useAccounts();
  const history = useAllSnapshots();
  const possessions = usePossessions();
  const stamp = currentMonth();

  const exportMonthly = () => {
    const byId = new Map((accounts.data ?? []).map((a) => [a.id, a]));
    const rows = (history.data ?? [])
      .filter((r) => byId.has(r.accountId))
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((r) => {
        const a = byId.get(r.accountId)!;
        return [
          r.month,
          a.name,
          TYPE_META[a.type].label,
          a.institution,
          a.mfCategory,
          r.value,
          r.invested,
          a.closed ? "yes" : "no",
        ];
      });
    downloadText(
      `bolero-monthly-values-${stamp}.csv`,
      toCsv(["Month", "Account", "Type", "Bank or platform", "Fund category", "Value", "Invested", "Closed"], rows),
    );
  };

  const exportPossessions = () => {
    const rows = (possessions.data ?? []).map((p) => [
      p.name,
      CATEGORY_META[p.category].label,
      p.purchasePrice,
      p.purchaseMonth,
      p.yearlyDropPct,
      Math.round(valueNow(p)),
    ]);
    downloadText(
      `bolero-possessions-${stamp}.csv`,
      toCsv(["Name", "Category", "Price paid", "Bought", "Yearly drop %", "Worth now"], rows),
    );
  };

  const monthlyReady = Boolean(accounts.data && history.data);

  return (
    <>
      <PageHeader title="Profile" />
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
            {initialOf(user?.fullName)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium">{user?.fullName}</p>
            <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Backup</h2>
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">
              Download your data as spreadsheets (CSV). Keep a copy somewhere safe, like your Drive.
            </p>
            <Button
              variant="outline"
              className="h-11 justify-start gap-2 rounded-xl"
              disabled={!monthlyReady || (history.data?.length ?? 0) === 0}
              onClick={exportMonthly}
            >
              <Download className="size-4" /> Monthly values
              <span className="ml-auto text-xs text-muted-foreground">{history.data?.length ?? 0} rows</span>
            </Button>
            <Button
              variant="outline"
              className="h-11 justify-start gap-2 rounded-xl"
              disabled={!possessions.data || possessions.data.length === 0}
              onClick={exportPossessions}
            >
              <Download className="size-4" /> Possessions
              <span className="ml-auto text-xs text-muted-foreground">{possessions.data?.length ?? 0} items</span>
            </Button>
          </div>
        </section>

        <Button variant="outline" className="h-11 gap-2 rounded-xl md:w-auto md:self-start" onClick={logout}>
          <LogOut className="size-4" /> Log out
        </Button>
      </div>
    </>
  );
}
