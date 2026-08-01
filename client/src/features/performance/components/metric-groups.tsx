import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  fmtDays,
  fmtInt,
  fmtNum,
  fmtPct,
  fmtPctRaw,
  fmtR,
} from "./performance-format";
import type { BacktestMetrics } from "../types/performance.types";

type Tone = "good" | "bad" | "muted" | "default";
interface Row {
  label: string;
  value: string;
  tone?: Tone;
}

export function MetricGroups({ m }: { m: BacktestMetrics }) {
  const groups: { title: string; rows: Row[] }[] = [
    {
      title: "Returns",
      rows: [
        { label: "Total Return", value: fmtPct(m.totalReturn, true), tone: signTone(m.totalReturn) },
        { label: "CAGR", value: fmtPct(m.cagr, true), tone: signTone(m.cagr) },
        { label: "Buy & Hold (eq-wt)", value: fmtPct(m.buyHoldEqualWeight, true) },
        { label: "Nifty 50 CAGR", value: fmtPct(m.niftyCagr, true) },
        { label: "Alpha vs Nifty", value: fmtPct(m.alphaVsNifty, true), tone: signTone(m.alphaVsNifty) },
        { label: "~Trades / yr", value: fmtInt(m.tradesPerYear) },
      ],
    },
    {
      title: "Risk",
      rows: [
        { label: "Max Drawdown", value: fmtPct(m.maxDrawdown), tone: "bad" },
        { label: "Avg Drawdown", value: fmtPct(m.avgDrawdown), tone: "muted" },
        { label: "Max DD Duration", value: fmtDays(m.maxDrawdownDurationDays) },
        { label: "Volatility (ann.)", value: fmtPct(m.volatilityAnnualized) },
      ],
    },
    {
      title: "Ratios",
      rows: [
        { label: "Sharpe", value: fmtNum(m.sharpe), tone: ratioTone(m.sharpe, 1) },
        { label: "Sortino", value: fmtNum(m.sortino), tone: ratioTone(m.sortino, 1) },
        { label: "Calmar", value: fmtNum(m.calmar), tone: ratioTone(m.calmar, 1) },
        { label: "Profit Factor", value: fmtNum(m.profitFactor), tone: ratioTone(m.profitFactor, 1) },
        { label: "R:R (payoff)", value: fmtNum(m.rr) },
      ],
    },
    {
      title: "Trade stats",
      rows: [
        { label: "Total Trades", value: fmtInt(m.totalTrades) },
        { label: "Win Rate", value: fmtPctRaw(m.winRate), tone: m.winRate != null && m.winRate >= 50 ? "good" : "default" },
        { label: "Loss Rate", value: fmtPctRaw(m.lossRate) },
        { label: "Best Trade", value: fmtR(m.bestTradeR), tone: "good" },
        { label: "Worst Trade", value: fmtR(m.worstTradeR), tone: "bad" },
        { label: "Avg Duration", value: fmtDays(m.avgTradeDurationDays) },
        { label: "Avg Win", value: fmtR(m.avgWinR), tone: "good" },
        { label: "Avg Loss", value: fmtR(m.avgLossR), tone: "bad" },
        { label: "Expectancy", value: fmtR(m.expectancyR), tone: signTone(m.expectancyR) },
        { label: "Longest Losing Streak", value: fmtInt(m.longestLosingStreak) },
        { label: "Max Consecutive Wins", value: fmtInt(m.maxConsecutiveWins) },
      ],
    },
    {
      title: "Robustness",
      rows: [
        { label: "OOS / IS return ratio", value: fmtNum(m.oosIsRatio), tone: ratioTone(m.oosIsRatio, 0.7) },
      ],
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {groups.map((g) => (
        <Card
          key={g.title}
          className="border-border/70 bg-card/70"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-[13px] uppercase tracking-[0.14em] text-muted-foreground font-medium">
              {g.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {g.rows.map((r) => (
              <div
                key={r.label}
                className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
              >
                <span className="text-sm text-muted-foreground">{r.label}</span>
                <span
                  className={cn(
                    "text-sm font-medium tabular",
                    r.tone === "good" && "text-primary",
                    r.tone === "bad" && "text-destructive",
                    r.tone === "muted" && "text-muted-foreground",
                  )}
                >
                  {r.value}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

const signTone = (n: number | null | undefined): Tone =>
  n == null ? "default" : n >= 0 ? "good" : "bad";
const ratioTone = (n: number | null | undefined, thresh: number): Tone =>
  n == null || !Number.isFinite(n) ? "default" : n >= thresh ? "good" : "bad";
