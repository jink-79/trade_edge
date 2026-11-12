import { ClipboardCheck } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { ComingSoon } from "@/components/common/coming-soon";

export function UpdatePage() {
  return (
    <>
      <PageHeader title="Monthly update" description="Enter this month's balance for every account." />
      <ComingSoon
        icon={ClipboardCheck}
        text="Once a month you'll enter each balance here, with a button to copy last month's numbers."
      />
    </>
  );
}
