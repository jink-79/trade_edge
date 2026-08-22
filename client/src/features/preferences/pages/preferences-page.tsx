import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Activity,
  CalendarRange,
  Check,
  Clock,
  Gauge,
  IndianRupee,
  Layers,
  Percent,
  RotateCcw,
  Save,
  Shield,
  Sliders,
  Target,
  TrendingUp,
  Waves,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { usePreferences, useSavePreferences } from "../hooks/use-preferences";
import type {
  Timeframe,
  TradingPreferences,
  TradingStyle,
} from "../types/preferences.types";

const styles = [
  { id: "swing", label: "Swing", desc: "Days to weeks", icon: Waves },
  {
    id: "intraday",
    label: "Intraday",
    desc: "Same-day entries & exits",
    icon: Clock,
  },
  {
    id: "positional",
    label: "Positional",
    desc: "Weeks to months",
    icon: CalendarRange,
  },
];

const timeframes = ["Daily", "Weekly", "Monthly"];

const inr = (n: number) =>
  n.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

function SectionCard({
  title,
  desc,
  icon: Icon,
  children,
}: {
  title: string;
  desc: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur shadow-(--shadow-card)">
      <div className="flex items-start gap-3 px-6 pt-5 pb-4 border-b border-border/60">
        <div className="size-9 rounded-xl grid place-items-center bg-primary/15 ring-1 ring-primary/30 shrink-0">
          <Icon className="size-4 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-[15px] font-semibold tracking-tight">
            {title}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function Metric({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-background/40 px-4 py-3">
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-display text-lg font-semibold tabular tracking-tight">
        {value}
      </div>
      {sub ? (
        <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>
      ) : null}
    </div>
  );
}

export function PreferencesPage() {
  const { data: prefs } = usePreferences();
  const saveMut = useSavePreferences();
  const saving = saveMut.isPending;

  const [selectedStyles, setSelectedStyles] = useState<string[]>(["swing"]);
  const [timeframe, setTimeframe] = useState("Daily");
  const [capital, setCapital] = useState("100000");
  const [riskPct, setRiskPct] = useState("1");
  const [maxPositions, setMaxPositions] = useState("5");
  const [atrPeriod, setAtrPeriod] = useState("14");
  const [stopAtr, setStopAtr] = useState(0.5);
  const [targetAtr, setTargetAtr] = useState(1);

  // Hydrate the form from saved preferences once they load
  useEffect(() => {
    if (!prefs) return;
    setSelectedStyles(prefs.tradingStyles);
    setTimeframe(prefs.timeframe);
    setCapital(String(prefs.defaultCapital));
    setRiskPct(String(prefs.riskPerTrade));
    setMaxPositions(String(prefs.maxConcurrentPositions));
    setAtrPeriod(String(prefs.atrPeriod));
    setStopAtr(prefs.slAtrMultiplier);
    setTargetAtr(prefs.targetAtrMultiplier);
  }, [prefs]);

  const toggleStyle = (id: string) =>
    setSelectedStyles((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );

  const base = Number(capital) || 0;
  const risk = Number(riskPct) || 0;
  const positions = Number(maxPositions) || 0;
  const riskPerTrade = (base * risk) / 100;
  const maxAtRisk = riskPerTrade * positions;
  const rr = useMemo(
    () => (stopAtr > 0 ? targetAtr / stopAtr : 0),
    [stopAtr, targetAtr],
  );

  const onReset = () => {
    setSelectedStyles(["swing"]);
    setTimeframe("Daily");
    setCapital("100000");
    setRiskPct("1");
    setMaxPositions("5");
    setAtrPeriod("14");
    setStopAtr(0.5);
    setTargetAtr(1);
    toast.info("Preferences reset to defaults.");
  };

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStyles.length === 0) {
      toast.error("Pick at least one trading style.");
      return;
    }
    if (base <= 0) {
      toast.error("Enter a valid base capital.");
      return;
    }

    const payload: TradingPreferences = {
      tradingStyles: selectedStyles as TradingStyle[],
      timeframe: timeframe as Timeframe,
      defaultCapital: base,
      riskPerTrade: risk,
      maxConcurrentPositions: positions,
      atrPeriod: Number(atrPeriod) || 14,
      slAtrMultiplier: stopAtr,
      targetAtrMultiplier: targetAtr,
    };

    saveMut.mutate(payload, {
      onSuccess: () => toast.success("Trading preferences saved."),
      onError: (err: any) =>
        toast.error(
          err?.response?.data?.message ?? "Could not save preferences.",
        ),
    });
  };

  return (
    <div className="px-8 py-8 space-y-8 max-w-[1600px]">
      <main className="">
        <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                // onClick={() => navigate({ to: "/" })}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="size-5" />
              </Button>
              <div>
                <h1 className="font-display text-xl font-semibold tracking-tight">
                  Preferences
                </h1>
                <p className="text-xs text-muted-foreground">
                  Trading style, capital, risk and volatility-based exits.
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={onReset}
                className="text-muted-foreground"
              >
                <RotateCcw className="size-4" />
                Reset
              </Button>
              <Button onClick={onSave} disabled={saving}>
                {saving ? (
                  <Check className="size-4" />
                ) : (
                  <Save className="size-4" />
                )}
                {saving ? "Saving…" : "Save preferences"}
              </Button>
            </div>
          </div>
        </header>

        <form onSubmit={onSave} className="px-6 py-6 space-y-6">
          <SectionCard
            title="Trading Style"
            desc="How you trade — pick all that apply and your primary timeframe."
            icon={TrendingUp}
          >
            <Label className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Styles
            </Label>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {styles.map((s) => {
                const active = selectedStyles.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleStyle(s.id)}
                    className={`text-left rounded-xl border px-4 py-3.5 transition-colors ${
                      active
                        ? "border-primary/50 bg-primary/10 ring-1 ring-primary/30"
                        : "border-border/70 bg-background/40 hover:bg-accent/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <s.icon
                        className={`size-4 ${active ? "text-primary" : "text-muted-foreground"}`}
                      />
                      {active ? (
                        <Check className="size-4 text-primary" />
                      ) : null}
                    </div>
                    <div className="mt-2 text-sm font-medium">{s.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {s.desc}
                    </div>
                  </button>
                );
              })}
            </div>

            <Label className="mt-6 block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Preferred timeframe
            </Label>
            <div className="mt-3 inline-flex rounded-xl border border-border/70 bg-background/40 p-1">
              {timeframes.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTimeframe(t)}
                  className={`px-4 h-9 rounded-lg text-sm transition-colors ${
                    timeframe === t
                      ? "bg-primary/15 text-foreground ring-1 ring-primary/30"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Capital & Risk"
            desc="Your base capital and how much of it you risk per trade."
            icon={Shield}
          >
            <div className="grid gap-5 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="capital">Default capital</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <Input
                    id="capital"
                    inputMode="numeric"
                    value={capital}
                    onChange={(e) =>
                      setCapital(e.target.value.replace(/[^\d.]/g, ""))
                    }
                    className="pl-8 tabular"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="risk">Risk per trade</Label>
                <div className="relative">
                  <Input
                    id="risk"
                    inputMode="decimal"
                    value={riskPct}
                    onChange={(e) =>
                      setRiskPct(e.target.value.replace(/[^\d.]/g, ""))
                    }
                    className="pr-8 tabular"
                  />
                  <Percent className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxpos">Max open positions</Label>
                <div className="relative">
                  <Layers className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <Input
                    id="maxpos"
                    inputMode="numeric"
                    value={maxPositions}
                    onChange={(e) =>
                      setMaxPositions(e.target.value.replace(/[^\d]/g, ""))
                    }
                    className="pl-8 tabular"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Metric
                label="Risk / trade"
                value={inr(riskPerTrade)}
                sub={`${risk || 0}% of capital`}
              />
              <Metric
                label="Max capital at risk"
                value={inr(maxAtRisk)}
                sub={`${positions || 0} positions`}
              />
              <Metric label="Base capital" value={inr(base)} />
            </div>
          </SectionCard>

          <SectionCard
            title="ATR-based Exits"
            desc="Volatility-based stop and target, as multiples of the ATR."
            icon={Activity}
          >
            <div className="space-y-2 max-w-xs">
              <Label htmlFor="atr">ATR period</Label>
              <div className="relative">
                <Gauge className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  id="atr"
                  inputMode="numeric"
                  value={atrPeriod}
                  onChange={(e) =>
                    setAtrPeriod(e.target.value.replace(/[^\d]/g, ""))
                  }
                  className="pl-8 pr-20 tabular"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  candles
                </span>
              </div>
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Sliders className="size-3.5 text-muted-foreground" />
                    Stop-loss × ATR
                  </Label>
                  <span className="text-sm tabular text-foreground">
                    {stopAtr.toFixed(1)}×
                  </span>
                </div>
                <Slider
                  className="mt-4"
                  value={[stopAtr]}
                  min={0.5}
                  max={5}
                  step={0.1}
                  onValueChange={(v) => setStopAtr(v[0])}
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Target className="size-3.5 text-muted-foreground" />
                    Target × ATR
                  </Label>
                  <span className="text-sm tabular text-foreground">
                    {targetAtr.toFixed(1)}×
                  </span>
                </div>
                <Slider
                  className="mt-4"
                  value={[targetAtr]}
                  min={0.5}
                  max={10}
                  step={0.1}
                  onValueChange={(v) => setTargetAtr(v[0])}
                />
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Metric
                label="Reward : Risk"
                value={`${rr.toFixed(2)} : 1`}
                sub={rr >= 2 ? "Healthy asymmetry" : "Consider a wider target"}
              />
              <Metric
                label="Stop multiple"
                value={`${stopAtr.toFixed(1)}× ATR`}
              />
              <Metric
                label="Target multiple"
                value={`${targetAtr.toFixed(1)}× ATR`}
              />
            </div>
          </SectionCard>

          <div className="flex justify-end gap-2 pb-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onReset}
              className="text-muted-foreground"
            >
              Reset
            </Button>
            <Button type="submit" disabled={saving}>
              <Save className="size-4" />
              {saving ? "Saving…" : "Save preferences"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
