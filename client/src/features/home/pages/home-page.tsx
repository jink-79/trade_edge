import { House } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { ComingSoon } from "@/components/common/coming-soon";

export function HomePage() {
  return (
    <>
      <PageHeader title="Net worth" description="Everything you own minus everything you owe." />
      <ComingSoon
        icon={House}
        text="Your net worth, this month's change and the 12-month trend will show here."
      />
    </>
  );
}
