"""Generic dataclasses shared by strategy rule modules — self-contained (no
dependency on any backtesting project). Split out from the original
phalanx-live repo's `core/rules.py` (which bundled these with the weekly
Phalanx v7 rules) since this repo only carries the daily Trend+RS strategy.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, Optional

import pandas as pd


@dataclass
class EntrySignal:
    trigger_price: float
    stop_price: float
    sizing_stop_price: Optional[float] = None
    reward_multiple: Optional[float] = None
    target_price: Optional[float] = None
    rank: Optional[float] = None


@dataclass
class Position:
    symbol: str
    entry_date: pd.Timestamp
    entry_price: float
    size: int
    sl_price: float
    tp_price: Optional[float]
    state: dict = None  # type: ignore[assignment]

    def __post_init__(self):
        if self.state is None:
            self.state = {}


@dataclass
class StrategyRules:
    scan: Callable[[pd.DataFrame], Optional[EntrySignal]]
    exit_signal: Optional[Callable[[pd.DataFrame, Position], bool]] = None
    min_history_bars: int = 70
    precompute: Optional[Callable[[pd.DataFrame], pd.DataFrame]] = None
