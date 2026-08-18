import { Waves } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  usePreferences,
  useSavePreferences,
} from "@/features/preferences/hooks/use-preferences";
import { STRATEGIES, strategyMeta, type StrategyId } from "./strategies";

/**
 * Sidebar quick-switch for the active strategy. Reads/writes the SAME server-saved
 * preference the Preferences page uses (Preferences is the source of truth), so a
 * switch here persists everywhere. Save is a full-replace upsert, so we send the
 * current prefs with just activeStrategy changed.
 */
export function StrategySwitcher() {
  const { data: prefs } = usePreferences();
  const save = useSavePreferences();
  const current = prefs?.activeStrategy ?? "trend-rs55";
  const meta = strategyMeta(current);

  const onChange = (id: string) => {
    if (!prefs || id === prefs.activeStrategy) return;
    save.mutate({ ...prefs, activeStrategy: id as StrategyId });
  };

  return (
    <div className="rounded-xl p-3.5 border border-border/70 bg-card/60 space-y-2.5">
      <div className="flex items-center gap-2">
        <div className="size-6 rounded-md bg-primary/15 grid place-items-center">
          <Waves className="size-3.5 text-primary" />
        </div>
        <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          Active strategy
        </span>
      </div>
      <Select
        value={current}
        onValueChange={onChange}
        disabled={!prefs || save.isPending}
      >
        <SelectTrigger className="w-full h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STRATEGIES.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-[11px] text-muted-foreground">{meta.sub}</p>
    </div>
  );
}
