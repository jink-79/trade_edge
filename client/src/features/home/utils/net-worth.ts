import { addMonths } from "@/lib/format";
import { TYPE_META } from "@/features/accounts/utils/account-meta";
import type { Account, AccountType, SnapshotRow } from "@/features/accounts/types/accounts.types";

export interface MonthPoint {
  month: string;
  assets: number;
  liabilities: number;
  net: number;
}

export interface NetWorthSummary {
  month: string;
  current: MonthPoint;
  previous: MonthPoint | null;
  /** Up to 12 months ending at `month`, oldest first, starting at the first month with data. */
  trend: MonthPoint[];
  byType: Record<AccountType, number>;
  /** Open accounts with no value entered for `month` (their last value is carried forward). */
  missing: Account[];
  /** Funds and stocks whose latest month has an invested amount. */
  investments: { value: number; invested: number } | null;
}

/**
 * Value of each account in a given month:
 * - before its first entry: nothing;
 * - open accounts carry their last entry forward until a new one is entered;
 * - closed accounts stop counting after their last entry.
 */
function valueAt(rows: SnapshotRow[], month: string, closed: boolean): number {
  let found: SnapshotRow | undefined;
  for (const r of rows) {
    if (r.month <= month) found = r;
    else break;
  }
  if (!found) return 0;
  const last = rows[rows.length - 1];
  if (closed && month > last.month) return 0;
  return found.value;
}

export function summarize(accounts: Account[], rows: SnapshotRow[], month: string): NetWorthSummary {
  const byAccount = new Map<string, SnapshotRow[]>();
  for (const r of rows) {
    const list = byAccount.get(r.accountId) ?? [];
    list.push(r);
    byAccount.set(r.accountId, list);
  }
  for (const list of byAccount.values()) list.sort((a, b) => a.month.localeCompare(b.month));

  const point = (m: string): MonthPoint => {
    let assets = 0;
    let liabilities = 0;
    for (const a of accounts) {
      const v = valueAt(byAccount.get(a.id) ?? [], m, a.closed);
      if (TYPE_META[a.type].liability) liabilities += v;
      else assets += v;
    }
    return { month: m, assets, liabilities, net: assets - liabilities };
  };

  const first = rows.reduce<string | null>((min, r) => (min === null || r.month < min ? r.month : min), null);
  const trend: MonthPoint[] = [];
  if (first) {
    for (let i = 11; i >= 0; i--) {
      const m = addMonths(month, -i);
      if (m >= first) trend.push(point(m));
    }
  }

  const prevMonth = addMonths(month, -1);
  const byType = { mf: 0, stock: 0, bank: 0, loan: 0, card: 0 } as Record<AccountType, number>;
  let invValue = 0;
  let invested = 0;
  for (const a of accounts) {
    const list = byAccount.get(a.id) ?? [];
    byType[a.type] += valueAt(list, month, a.closed);
    if (!a.closed && TYPE_META[a.type].tracksInvested) {
      const latest = [...list].reverse().find((r) => r.month <= month);
      if (latest && latest.invested != null) {
        invValue += latest.value;
        invested += latest.invested;
      }
    }
  }

  return {
    month,
    current: point(month),
    previous: first && prevMonth >= first ? point(prevMonth) : null,
    trend,
    byType,
    missing: accounts.filter(
      (a) => !a.closed && !(byAccount.get(a.id) ?? []).some((r) => r.month === month),
    ),
    investments: invested > 0 ? { value: invValue, invested } : null,
  };
}
