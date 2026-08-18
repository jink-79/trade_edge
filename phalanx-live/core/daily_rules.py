"""Trend + RS-55 strategy rules — daily-timeframe strategy, self-contained
(no dependency on the backtesting project), same EntrySignal/Position/
StrategyRules interface (see `core/types.py`) so `live/generate_daily_signals.py`
can reuse the exact pattern established for the original repo's weekly side.

Entry (both must hold):
1. Trend flips from down to up on this bar (the get_htf() state machine
   below flips Trend from 1 -> 0).
2. RS-55: stock's 55-day return outperforms Nifty's 55-day return
   (RS = (close/close[55]) / (nifty_close/nifty_close[55]) - 1 > 0).

Exit ("trend_flip", the validated baseline -- no trailing stop):
- Trend flips from up to down (Trend from 0 -> 1).
No minimum hold period; the trend state machine's own inertia (it only
flips on a real structure break) is what prevents whipsaw churn.

The get_htf() state machine mirrors the TradingView Pine Script
"Trend with 200 EMA and 50 EMA" indicator (himadrig) bar-by-bar,
translating its stateful `:=` semantics exactly rather than approximating
with a rolling-window formula -- it's a genuine finite-state machine with
feedback, not expressible any other way.
"""

from __future__ import annotations

from typing import Optional

import numpy as np
import pandas as pd

from core.types import EntrySignal, Position, StrategyRules  # generic dataclasses, reused as-is

RS_LOOKBACK_DAYS = 55
MIN_HISTORY_BARS = 120  # RS-55 floor + comfortable runway for the trend state machine to settle


def _compute_trend(df: pd.DataFrame) -> pd.DataFrame:
    """Bar-by-bar port of the Pine script's get_htf(). df needs High/Low/Close."""
    high = df["High"].to_numpy(dtype=float)
    low = df["Low"].to_numpy(dtype=float)
    close = df["Close"].to_numpy(dtype=float)
    n = len(df)

    lowest_low_3 = df["Low"].rolling(3, min_periods=1).min().to_numpy()
    highest_high_2 = df["High"].rolling(2, min_periods=1).max().to_numpy()
    ma_low_3 = df["Low"].ewm(span=3, adjust=False).mean().to_numpy()      # ta.ema(low, 3)
    ma_high_2 = df["High"].rolling(2, min_periods=1).mean().to_numpy()    # ta.sma(high, 2)

    trend = np.zeros(n, dtype=int)
    buy_signal = np.zeros(n, dtype=bool)
    sell_signal = np.zeros(n, dtype=bool)

    nt = 0
    tr = 0
    low_max = low[0]
    high_min = high[0]

    for i in range(n):
        prev_low = low[i - 1] if i >= 1 else low[i]
        prev_high = high[i - 1] if i >= 1 else high[i]
        trend_prev = tr

        if nt == 1:
            low_max = max(low_max, lowest_low_3[i])
            if ma_high_2[i] < low_max and close[i] < prev_low:
                tr = 1
                nt = 0
                high_min = highest_high_2[i]

        if nt == 0:
            high_min = min(high_min, highest_high_2[i])
            if ma_low_3[i] > high_min and close[i] > prev_high:
                tr = 0
                nt = 1
                low_max = lowest_low_3[i]

        if tr == 0 and trend_prev == 1:
            buy_signal[i] = True
        if tr == 1 and trend_prev == 0:
            sell_signal[i] = True

        trend[i] = tr

    out = df.copy()
    out["trend"] = trend
    out["buy_signal"] = buy_signal
    out["sell_signal"] = sell_signal
    out["ema200"] = df["Close"].ewm(span=200, adjust=False).mean()
    out["ema50"] = df["Close"].ewm(span=50, adjust=False).mean()
    return out


def make_precompute(nifty_df: pd.DataFrame):
    nifty_close = nifty_df["Close"]

    def precompute(df: pd.DataFrame) -> pd.DataFrame:
        df = _compute_trend(df)
        aligned_nifty = nifty_close.reindex(df.index).ffill()
        stock_factor = df["Close"] / df["Close"].shift(RS_LOOKBACK_DAYS)
        nifty_factor = aligned_nifty / aligned_nifty.shift(RS_LOOKBACK_DAYS)
        df["rs55"] = stock_factor / nifty_factor - 1
        return df

    return precompute


def scan(hist: pd.DataFrame) -> Optional[EntrySignal]:
    bar = hist.iloc[-1]
    if pd.isna(bar["rs55"]):
        return None
    if not bool(bar["buy_signal"]):
        return None
    if not (bar["rs55"] > 0):
        return None
    return EntrySignal(trigger_price=0, stop_price=0, rank=float(bar["rs55"]))


def exit_signal(hist: pd.DataFrame, position: Position) -> bool:
    bar = hist.iloc[-1]
    return bool(bar["sell_signal"])


def make_rules(nifty_df: pd.DataFrame) -> StrategyRules:
    return StrategyRules(
        scan=scan,
        precompute=make_precompute(nifty_df),
        exit_signal=exit_signal,
        min_history_bars=MIN_HISTORY_BARS,
    )
