import { Landmark } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { ComingSoon } from "@/components/common/coming-soon";

export function AccountsPage() {
  return (
    <>
      <PageHeader title="Accounts" description="Mutual funds, stocks, bank, loans and credit cards." />
      <ComingSoon
        icon={Landmark}
        text="Add the accounts you want to track. Loans and credit cards count against your net worth."
      />
    </>
  );
}
