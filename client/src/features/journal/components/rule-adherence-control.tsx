import { CheckCircle2, Hand, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useSetRuleAdherence } from "../hooks/use-journal";
import { useDailySignalHistory } from "@/features/algo-signals/hooks/use-algo-signals";
import { isTrendRs55 } from "../utils/journal-utils";
import type { JournalTrade } from "../types/journal.types";

/**
 * Behavioural tag: did this trade follow the system, or was it discretionary?
 * The aggregate of this across trades usually reveals that discretionary calls
 * bleed money — the highest-payoff, lowest-effort thing to track.
 */
export function RuleAdherenceControl({ trade }: { trade: JournalTrade }) {
  const mut = useSetRuleAdherence();
  const e = trade.entry;
  const trendRs55 = isTrendRs55(trade);

  // Auto-hint (rsi2 only): how many of the four Tier-1 rule-checks the entry
  // actually passed — the trend-flip strategy has no equivalent checklist,
  // every trade either matched the signal or it wasn't captured at all.
  const checks = [
    e.priceAbove200,
    e.rsi2 <= 10,
    e.candlesFromHigh <= 20,
    e.distanceFrom200Ema >= 0,
  ];
  const passed = checks.filter(Boolean).length;

  // Auto-verified (trend-rs55 only): did this symbol actually appear in that
  // day's daily_signals — real signal-following verification instead of a
  // vague self-report. `to` is entry date + 1 day since reference_date is
  // stored with a time component and would otherwise miss a same-day match.
  const entryDateStr = e.entryDate.slice(0, 10);
  const nextDayStr = new Date(new Date(entryDateStr).getTime() + 86400000)
    .toISOString()
    .slice(0, 10);
  const { data: signalDocs, isLoading: signalLoading } = useDailySignalHistory(
    trendRs55 ? { from: entryDateStr, to: nextDayStr, limit: 5 } : undefined,
  );
  const signalDoc = signalDocs?.find((d) => d.reference_date.slice(0, 10) === entryDateStr);
  const inToBuy = signalDoc?.to_buy?.includes(e.ticker) ?? false;
  const candidateRank = signalDoc?.buy_candidates_ranked?.findIndex((c) => c.symbol === e.ticker);
  const inCandidates = candidateRank != null && candidateRank >= 0;

  const set = (value: "system" | "discretionary") => {
    const next = trade.ruleAdherence === value ? null : value;
    mut.mutate(
      { id: trade.id, ruleAdherence: next },
      {
        onSuccess: () =>
          toast.success(
            next ? `Tagged as ${next}` : "Adherence tag cleared",
          ),
        onError: () => toast.error("Could not update adherence"),
      },
    );
  };

  const trendRs55Description = signalLoading
    ? "Checking that day's Overwatch signal…"
    : !signalDoc
      ? "No signal data for this entry date — can't auto-verify. Tag it yourself."
      : inToBuy
        ? "✓ Matched that day's sized picks — a real system entry."
        : inCandidates
          ? `Ranked #${candidateRank! + 1} in that day's candidates but not sized (capital/slots) — you took it anyway.`
          : "⚠ This symbol wasn't in that day's ranked candidates at all — looks like a discretionary override.";

  return (
    <Card
      className="border-border/70 bg-card/70"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <ShieldCheck className="size-4 text-primary" /> Rule adherence
        </CardTitle>
        <CardDescription>
          {trendRs55
            ? trendRs55Description
            : `${passed}/4 entry rule-checks passed${
                passed === 4
                  ? " — a textbook system entry."
                  : " — some checks failed; was taking it a discretionary call?"
              }`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <AdherenceButton
            active={trade.ruleAdherence === "system"}
            disabled={mut.isPending}
            icon={<CheckCircle2 className="size-4" />}
            label="System"
            desc="Followed the rules"
            onClick={() => set("system")}
          />
          <AdherenceButton
            active={trade.ruleAdherence === "discretionary"}
            disabled={mut.isPending}
            icon={<Hand className="size-4" />}
            label="Discretionary"
            desc="A judgement call"
            tone="warn"
            onClick={() => set("discretionary")}
          />
        </div>
        {trade.ruleAdherence == null && (
          <p className="text-[11px] text-muted-foreground">
            Tag every trade — comparing system vs discretionary expectancy is
            where the behavioural edge shows up.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function AdherenceButton({
  active,
  disabled,
  icon,
  label,
  desc,
  tone = "good",
  onClick,
}: {
  active: boolean;
  disabled: boolean;
  icon: React.ReactNode;
  label: string;
  desc: string;
  tone?: "good" | "warn";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-xl border px-3 py-3 text-left transition-colors disabled:opacity-60",
        active
          ? tone === "warn"
            ? "border-[oklch(0.82_0.16_85/0.5)] bg-[oklch(0.82_0.16_85/0.1)]"
            : "border-primary/50 bg-primary/10"
          : "border-border/60 hover:bg-accent/40",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-1.5 font-medium text-sm",
          active
            ? tone === "warn"
              ? "text-[oklch(0.82_0.16_85)]"
              : "text-primary"
            : "text-foreground",
        )}
      >
        {icon} {label}
      </div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{desc}</div>
    </button>
  );
}
