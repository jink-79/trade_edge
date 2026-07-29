import { useParams } from "react-router-dom";
import { TradeDetailView } from "@/features/journal/components/trade-detail-view";

export function TradeDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <TradeDetailView id={id} />;
}
