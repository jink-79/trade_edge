import {
  Clock,
  Tag,
  Copy,
  Pencil,
  MoreHorizontal,
  Hash,
  Gauge,
  TrendingUp,
  LineChart,
  ArrowUpRight,
  Target,
  XCircle,
  Shield,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type Setup } from "../types/playbook.types";
import { biasStyles, statusStyles } from "../utils/playbook-utils";
import { RuleBlock } from "./rule-block";
import { RiskRow } from "./risk-row";

interface SetupDetailProps {
  setup: Setup | null;
}

export function SetupDetail({ setup }: SetupDetailProps) {
  if (!setup) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 bg-card/40 p-10 text-center text-sm text-muted-foreground">
        Select a setup to view detailed execution rules.
      </div>
    );
  }

  const doneCount = setup.checklist.filter((c) => c.done).length;
  const total = setup.checklist.length;
  const percentage = total ? (doneCount / total) * 100 : 0;

  return (
    <Card className="sticky top-20 self-start overflow-hidden border-border/60 bg-card/60 backdrop-blur">
      <CardHeader className="border-b border-border/60 bg-linear-to-br from-primary/10 via-transparent to-transparent p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn("gap-1 text-[10px]", statusStyles[setup.status])}
              >
                <span className="size-1.5 rounded-full bg-current" />
                {setup.status}
              </Badge>
              <Badge
                variant="outline"
                className={cn("text-[10px]", biasStyles[setup.bias])}
              >
                {setup.bias}
              </Badge>
              <Badge
                variant="outline"
                className="border-border/60 bg-secondary/50 text-[10px] text-muted-foreground"
              >
                <Clock className="mr-1 size-3" /> {setup.timeframe}
              </Badge>
              <Badge
                variant="outline"
                className="border-border/60 bg-secondary/50 text-[10px] text-muted-foreground"
              >
                <Tag className="mr-1 size-3" /> {setup.category}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight">
                {setup.name}
              </h2>
              <span className="rounded-md border border-border/60 bg-secondary/60 px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                {setup.tag}
              </span>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {setup.description}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground"
            >
              <Copy className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground"
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-4 gap-3 rounded-xl border border-border/60 bg-background/40 p-3">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              <Hash className="size-3.5" /> Trades
            </div>
            <p className="mt-1 font-mono text-base font-bold text-foreground">
              {setup.trades}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              <Gauge className="size-3.5" /> Win Rate
            </div>
            <p className="mt-1 font-mono text-base font-bold text-success">
              {setup.trades ? `${setup.winRate.toFixed(1)}%` : "—"}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              <TrendingUp className="size-3.5" /> Avg R
            </div>
            <p className="mt-1 font-mono text-base font-bold text-primary">
              {setup.trades ? `${setup.avgR.toFixed(2)}R` : "—"}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              <LineChart className="size-3.5" /> Expectancy
            </div>
            <p className="mt-1 font-mono text-base font-bold text-warning">
              {setup.trades
                ? `₹${setup.expectancy.toLocaleString("en-IN")}`
                : "—"}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
        <RuleBlock
          icon={<ArrowUpRight className="size-4" />}
          title="Entry Rules"
          tone="success"
          items={setup.entry}
        />
        <RuleBlock
          icon={<Target className="size-4" />}
          title="Exit Rules"
          tone="primary"
          items={setup.exit}
        />
        <RuleBlock
          icon={<XCircle className="size-4" />}
          title="Invalidation"
          tone="destructive"
          items={setup.invalidate}
        />

        <div className="rounded-xl border border-border/60 bg-background/40 p-4">
          <div className="mb-3 flex items-center gap-2 text-warning">
            <Shield className="size-4" />
            <h4 className="text-sm font-semibold">Risk Envelope</h4>
          </div>
          <dl className="space-y-2 text-xs">
            <RiskRow label="Risk / trade" value={setup.risk.perTrade} />
            <RiskRow label="Stop loss" value={setup.risk.stop} />
            <RiskRow label="Reward : Risk" value={setup.risk.rr} />
            <RiskRow label="Position cap" value={setup.risk.position} />
          </dl>
        </div>

        <div className="md:col-span-2 rounded-xl border border-border/60 bg-background/40 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary">
              <Zap className="size-4" />
              <h4 className="text-sm font-semibold">Pre-Trade Checklist</h4>
            </div>
            <span className="font-mono text-xs text-muted-foreground">
              {doneCount}/{total} ready
            </span>
          </div>
          <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-secondary/60">
            <div
              className="h-full rounded-full bg-linear-to-r from-primary to-success transition-all"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {setup.checklist.map((item, i) => (
              <li
                key={i}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs",
                  item.done
                    ? "border-success/30 bg-success/5 text-foreground"
                    : "border-border/60 bg-secondary/30 text-muted-foreground",
                )}
              >
                {item.done ? (
                  <CheckCircle2 className="size-4 text-success" />
                ) : (
                  <AlertTriangle className="size-4 text-muted-foreground" />
                )}
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Activity className="size-3.5" />
            Last used: <span className="text-foreground">{setup.lastUsed}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <LineChart className="size-4" /> View trades
            </Button>
            <Button size="sm" className="gap-2">
              <Plus className="size-4" /> Log trade with setup
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
