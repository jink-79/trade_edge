import type { BacktestMetrics, MetricGroup, Num } from "../types/report.types";
import { inr, int, num, pct, weeks } from "../types/report.types";

const tone = (n: Num) => (n == null ? undefined : n >= 0 ? ("pos" as const) : ("neg" as const));

// Dates arrive as ISO strings ("2015-01-05T00:00:00.000Z"); show just the day.
const shortDate = (s: string | null) => (s ? s.slice(0, 10) : null);

/** Groups the flat BacktestMetrics into the schema doc's §1-16 sections. Only
 * fields the schema actually defines — nothing here is invented. */
export function buildMetricGroups(m: BacktestMetrics): MetricGroup[] {
  return [
    {
      title: "General",
      desc: "Run metadata — schema §1",
      rows: [
        { label: "Universe", value: m.universe || NA_STR },
        { label: "Universe Size", value: int(m.universeSize) },
        { label: "Symbols With Data", value: int(m.symbolsWithData) },
        { label: "Symbols Traded", value: int(m.symbolsTraded) },
        { label: "Timeframe", value: m.timeframe ?? NA_STR },
        {
          label: "Start / End",
          // Years keep the card to one line; full dates on hover.
          value: m.startDate && m.endDate ? `${m.startDate.slice(0, 4)} → ${m.endDate.slice(0, 4)}` : NA_STR,
          title: m.startDate && m.endDate ? `${shortDate(m.startDate)} → ${shortDate(m.endDate)}` : undefined,
        },
        { label: "Years Tested", value: num(m.yearsTested, 1) },
        { label: "Initial Capital", value: inr(m.initialCapital) },
        { label: "Final Capital", value: inr(m.finalCapital) },
        { label: "Commission", value: pct(m.commissionPct, 2) },
      ],
    },
    {
      title: "Returns",
      desc: "Headline growth vs. a passive baseline — schema §2",
      rows: [
        { label: "Total Return", value: pct(m.totalReturnPct), tone: tone(m.totalReturnPct) },
        { label: "CAGR", value: pct(m.cagrPct), tone: tone(m.cagrPct) },
        { label: "Net Profit", value: inr(m.netProfit), tone: tone(m.netProfit) },
        { label: "Avg Annual Return", value: pct(m.avgAnnualReturnPct) },
        { label: "Avg Monthly Return", value: pct(m.avgMonthlyReturnPct) },
        { label: "Nifty 50 CAGR", value: pct(m.niftyCagrPct) },
        { label: "Alpha vs Nifty", value: m.alphaPct != null ? `${m.alphaPct.toFixed(1)}pp` : NA_STR, tone: tone(m.alphaPct) },
      ],
    },
    {
      title: "Risk",
      desc: "Drawdown depth, duration and realised volatility — schema §3",
      rows: [
        { label: "Max Drawdown", value: pct(m.maxDrawdownPct), tone: "neg" },
        { label: "Avg Drawdown", value: pct(m.avgDrawdownPct), tone: "neg" },
        { label: "Max DD Length", value: weeks(m.maxDrawdownWeeks) },
        { label: "Recovery", value: weeks(m.recoveryWeeks) },
        { label: "Volatility (Ann.)", value: pct(m.volatilityPct, 1) },
        { label: "Ulcer Index", value: num(m.ulcerIndex) },
      ],
    },
    {
      title: "Risk-adjusted returns",
      desc: "Schema §4",
      rows: [
        { label: "Sharpe", value: num(m.sharpe), tone: tone((m.sharpe ?? 0) - 1) },
        { label: "Sortino", value: num(m.sortino), tone: tone((m.sortino ?? 0) - 1) },
        { label: "Calmar", value: num(m.calmar), tone: tone((m.calmar ?? 0) - 1) },
        { label: "Equity Curve R²", value: num(m.equityCurveR2) },
      ],
    },
    {
      title: "Trade statistics",
      desc: "Schema §5",
      rows: [
        { label: "Total Trades", value: int(m.totalTrades) },
        { label: "Winning Trades", value: int(m.winningTrades) },
        { label: "Losing Trades", value: int(m.losingTrades) },
        { label: "Win Rate", value: pct(m.winRatePct, 1), tone: tone((m.winRatePct ?? 0) - 50) },
        { label: "Loss Rate", value: pct(m.lossRatePct, 1) },
        { label: "No-Trade Years", value: m.noTradeYears.length ? m.noTradeYears.join(", ") : NA_STR },
      ],
    },
    {
      title: "Profitability",
      desc: "Schema §6",
      rows: [
        { label: "Profit Factor", value: num(m.profitFactor), tone: tone((m.profitFactor ?? 0) - 1) },
        { label: "Expectancy", value: pct(m.expectancyPct), tone: tone(m.expectancyPct) },
        { label: "Median Trade", value: pct(m.medianTradePct) },
        { label: "Avg Win", value: pct(m.avgWinPct), tone: "pos" },
        { label: "Avg Loss", value: pct(m.avgLossPct), tone: "neg" },
        { label: "Reward:Risk", value: num(m.rewardRiskRatio) },
      ],
    },
    {
      title: "Best / worst trades",
      desc: "Schema §7",
      rows: [
        { label: "Best Trade", value: pct(m.bestTradePct), tone: "pos" },
        { label: "Worst Trade", value: pct(m.worstTradePct), tone: "neg" },
        { label: "Largest Win", value: inr(m.largestWinRs), tone: "pos" },
        { label: "Largest Loss", value: inr(m.largestLossRs), tone: "neg" },
        { label: "Top-10 Winners Contribution", value: pct(m.top10WinnersContributionPct, 1) },
        { label: "Top-10 Losers Contribution", value: pct(m.top10LosersContributionPct, 1) },
      ],
    },
    {
      title: "Streaks",
      desc: "Schema §8",
      rows: [
        { label: "Max Win Streak", value: int(m.maxWinStreak) },
        { label: "Max Loss Streak", value: int(m.maxLossStreak) },
        { label: "Avg Win Streak", value: num(m.avgWinStreak, 1) },
        { label: "Avg Loss Streak", value: num(m.avgLossStreak, 1) },
      ],
    },
    {
      title: "Holding period",
      desc: "Tracked natively in weeks — schema §9",
      rows: [
        { label: "Avg Hold", value: weeks(m.avgHoldWeeks) },
        { label: "Median Hold", value: weeks(m.medianHoldWeeks) },
        { label: "Max Hold", value: weeks(m.maxHoldWeeks) },
        { label: "Min Hold", value: weeks(m.minHoldWeeks) },
        { label: "Avg Winning Hold", value: weeks(m.avgWinningHoldWeeks) },
        { label: "Avg Losing Hold", value: weeks(m.avgLosingHoldWeeks) },
      ],
    },
    {
      title: "Execution & exposure",
      desc: "Position sizing, capital deployment, time in market — schema §10-11",
      rows: [
        { label: "Avg Position Size", value: inr(m.avgPositionSizeRs) },
        { label: "Avg Position Count Exposure", value: pct(m.avgPositionCountExposure != null ? m.avgPositionCountExposure * 100 : null, 1) },
        { label: "Capital Utilization", value: pct(m.avgCapitalUtilizationPct, 1) },
        { label: "Cash Idle", value: pct(m.cashIdlePct, 1) },
        { label: "Max Concurrent Positions", value: int(m.maxConcurrentPositions) },
        { label: "Time in Market", value: pct(m.timeInMarketPct, 1) },
        { label: "Trades / Year", value: num(m.tradesPerYear, 1) },
        { label: "Trades / Month", value: num(m.tradesPerMonth, 1) },
      ],
    },
    {
      title: "Distribution",
      desc: "Schema §13",
      rows: [
        { label: "Portfolio Volatility", value: pct(m.portfolioVolatilityPct, 1) },
        { label: "Trade Return Std Dev", value: pct(m.tradeReturnStdDevPct, 1) },
        { label: "Trade Return Skew", value: num(m.tradeReturnSkew) },
        { label: "Trade Return Kurtosis", value: num(m.tradeReturnKurtosis) },
        { label: "Profitable Months", value: pct(m.profitableMonthsPct, 1) },
      ],
    },
    {
      title: "Monthly & yearly",
      desc: "Schema §14",
      rows: [
        { label: "Best Month", value: pct(m.bestMonthPct), tone: "pos" },
        { label: "Worst Month", value: pct(m.worstMonthPct), tone: "neg" },
        { label: "Best Year", value: pct(m.bestYearPct), tone: "pos" },
        { label: "Worst Year", value: pct(m.worstYearPct), tone: "neg" },
        { label: "Positive Years", value: pct(m.positiveYearsPct, 0) },
      ],
    },
    {
      title: "Trade quality",
      desc: "Schema §15-16",
      rows: [
        { label: "SQN", value: num(m.sqn) },
        { label: "Kelly %", value: pct(m.kellyPct, 1) },
        { label: "Avg Trades / Symbol", value: num(m.avgTradesPerSymbol, 1) },
      ],
    },
  ];
}

const NA_STR = "Not available";
