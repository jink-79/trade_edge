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
import type { JournalTrade } from "../types/journal.types";

/**
 * Behavioural tag: did this trade follow the system, or was it discretionary?
 * The aggregate of this across trades usually reveals that discretionary calls
 * bleed money — the highest-payoff, lowest-effort thing to track.
 */
export function RuleAdherenceControl({ trade }: { trade: JournalTrade }) {
  const mut = useSetRuleAdherence();
  const e = trade.entry;

  // Auto-hint: how many of the four Tier-1 rule-checks the entry actually passed.
  const checks = [
    e.priceAbove200,
    e.rsi2 <= 10,
    e.candlesFromHigh <= 20,
    e.distanceFrom200Ema >= 0,
  ];
  const passed = checks.filter(Boolean).length;

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
          {passed}/4 entry rule-checks passed
          {passed === 4
            ? " — a textbook system entry."
            : " — some checks failed; was taking it a discretionary call?"}
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
