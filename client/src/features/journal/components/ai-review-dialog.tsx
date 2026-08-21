import { useEffect } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAiReview } from "../hooks/use-journal";
import type { JournalTrade } from "../types/journal.types";

export function AiReviewDialog({
  trade,
  onClose,
}: {
  trade: JournalTrade | null;
  onClose: () => void;
}) {
  const aiReview = useAiReview();

  useEffect(() => {
    if (trade) {
      aiReview.mutate(trade.id, {
        onError: (err: any) => {
          toast.error(
            err?.response?.data?.message ?? "Could not fetch an AI review right now",
          );
        },
      });
    }
    // Only re-fetch when a different trade is opened, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trade?.id]);

  return (
    <Dialog open={!!trade} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            AI review · {trade?.entry.ticker}
          </DialogTitle>
          <DialogDescription>
            General knowledge from Gemini — not live data, not news. Verify before
            acting on anything below.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-[100px] flex items-center">
          {aiReview.isPending ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Thinking…
            </div>
          ) : aiReview.isError ? (
            <p className="text-sm text-muted-foreground">
              Couldn't fetch a review for this position — try again in a moment.
            </p>
          ) : (
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">
              {aiReview.data?.aiReview}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
