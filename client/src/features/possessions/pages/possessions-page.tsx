import { Sofa } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { ComingSoon } from "@/components/common/coming-soon";

export function PossessionsPage() {
  return (
    <>
      <PageHeader title="Possessions" description="Things you own, like your bike, fridge and bed." />
      <ComingSoon
        icon={Sofa}
        text="Add what you bought and when. Its value goes down a little every year."
      />
    </>
  );
}
