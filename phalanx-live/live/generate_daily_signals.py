"""Daily signal generator for the Trend+RS-55 strategy — reads daily OHLCV
from Atlas, applies the rules (`core/daily_rules.py`), and writes the
result into Atlas (`daily_signals` collection), which trade-edge-api reads
read-only for the Algo Signals page.

Held positions come from `live/positions_daily.json` — hand-maintained,
starts empty, signal-only (no auto-orders): update it yourself after
actually placing orders.

No TradeEdge integration yet -- max_positions defaults to
MAX_POSITIONS_DEFAULT below.

Run:
    python -m live.generate_daily_signals
"""

from __future__ import annotations

import json
import sys
from datetime import date, datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT))
sys.path.insert(0, str(Path(__file__).resolve().parent))

import pandas as pd

import db
from core.daily_rules import Position, make_rules

POSITIONS_FILE = Path(__file__).resolve().parent / "positions_daily.json"
DATA_START = "2015-01-01"  # wide window; Atlas only retains RETENTION_DAYS anyway
SIGNALS_COLLECTION = db.DAILY_SIGNALS
CAPITAL_DEFAULT = 500_000.0  # Rs 5L deployed to this strategy
MAX_POSITIONS_DEFAULT = 5    # -> Rs 1,00,000 per slot; actual trading cap (sizing, free_slots, to_buy)
MAX_CANDIDATES_STORED = 15   # ranked candidates kept in Atlas, wider than MAX_POSITIONS_DEFAULT for visibility
ENTRY_COST_PCT = 0.002       # ~0.2% brokerage+STT+slippage, one side -- for indicative sizing only


def load_positions() -> list[dict]:
    if not POSITIONS_FILE.exists():
        return []
    return json.loads(POSITIONS_FILE.read_text())


def to_position_obj(p: dict) -> Position:
    return Position(
        symbol=p["symbol"],
        entry_date=pd.Timestamp(p["entry_date"]),
        entry_price=p["entry_price"],
        size=p["size"],
        sl_price=0,
        tp_price=None,
        state=dict(p.get("state", {})),
    )


def load_atlas_ohlcv(symbols: list[str], start_date: str, end_date: str) -> dict[str, pd.DataFrame]:
    database = db.get_db()
    start = pd.Timestamp(start_date).to_pydatetime()
    end = pd.Timestamp(end_date).to_pydatetime()
    frames: dict[str, pd.DataFrame] = {}
    for symbol in symbols:
        docs = list(
            database[db.OHLCV]
            .find(
                {
                    "symbol": symbol,
                    "timeframe": "daily",
                    "date": {"$gte": start, "$lte": end},
                    "is_complete": True,
                }
            )
            .sort("date", 1)
        )
        if not docs:
            continue
        frame = pd.DataFrame(docs)
        frame = frame[frame["volume"] > 0]
        if frame.empty:
            continue
        frame = frame.set_index("date")[["open", "high", "low", "close", "volume"]]
        frame.columns = ["Open", "High", "Low", "Close", "Volume"]
        frames[symbol] = frame.sort_index()
    return frames


def get_tracked_symbols() -> list[str]:
    database = db.get_db()
    return sorted(database[db.SYMBOLS].distinct("symbol", {"tracked": True}))


def generate() -> dict:
    held = load_positions()
    held_symbols = {p["symbol"] for p in held}
    max_positions = MAX_POSITIONS_DEFAULT
    slot_size = CAPITAL_DEFAULT / max_positions

    print("=" * 70)
    print("  TREND+RS — DAILY SIGNAL GENERATOR (Atlas)")
    print("=" * 70)
    print(f"  Currently held positions: {len(held)}  ({', '.join(held_symbols) or 'none'})")
    print(f"  Capital: Rs {CAPITAL_DEFAULT:,.0f}  |  Max positions: {max_positions}  |  Slot size: Rs {slot_size:,.0f}  (fixed, no TradeEdge wiring yet)")

    symbols = get_tracked_symbols()
    end_date = date.today().isoformat()
    frames = load_atlas_ohlcv(symbols, DATA_START, end_date)
    nifty_df = load_atlas_ohlcv(["NIFTY"], DATA_START, end_date).get("NIFTY")
    if nifty_df is None or nifty_df.empty:
        raise RuntimeError("No NIFTY data in Atlas — run live.update_daily first.")

    rules = make_rules(nifty_df)
    frames = {s: rules.precompute(df) for s, df in frames.items()}

    reference_date = nifty_df.index.max()
    print(f"  Reference date (latest complete close): {reference_date.date()}")

    stale = [s for s, df in frames.items() if df.index.max() < reference_date]
    if stale:
        print(f"  Stale (skipped, no fresh data today): {', '.join(sorted(stale))}")

    # --- Exits ---
    print()
    print("-" * 70)
    print("  EXITS")
    print("-" * 70)
    exits = []
    for p in held:
        symbol = p["symbol"]
        frame = frames.get(symbol)
        if frame is None or frame.index.max() < reference_date:
            print(f"  ! {symbol}: no fresh data today — cannot evaluate, check manually")
            continue
        hist = frame.loc[:reference_date]
        pos = to_position_obj(p)
        if rules.exit_signal(hist, pos):
            print(f"  SELL {symbol:12} (entered {p['entry_date']} @ {p['entry_price']}) — trend flip")
            exits.append(symbol)
        else:
            print(f"  hold {symbol:12} (entered {p['entry_date']} @ {p['entry_price']})")

    # --- New entries ---
    print()
    print("-" * 70)
    print("  NEW ENTRY CANDIDATES")
    print("-" * 70)
    open_after_exits = len(held) - len(exits)
    free_slots = max(0, max_positions - open_after_exits)
    print(f"  Open after exits: {open_after_exits}  |  Free slots: {free_slots}")

    candidates = []
    for symbol, frame in frames.items():
        if symbol in held_symbols or symbol == "NIFTY":
            continue
        if frame.index.max() < reference_date:
            continue
        hist = frame.loc[:reference_date]
        if len(hist) < rules.min_history_bars:
            continue
        signal = rules.scan(hist)
        if signal is not None:
            candidates.append((symbol, signal))

    candidates.sort(key=lambda c: (-(c[1].rank if c[1].rank is not None else 0.0), c[0]))
    to_buy = [c[0] for c in candidates[:free_slots]]

    def _sizing(symbol: str) -> tuple[float, int]:
        ref_price = float(frames[symbol]["Close"].loc[reference_date])
        qty = int(slot_size // (ref_price * (1 + ENTRY_COST_PCT)))
        return ref_price, qty

    if not candidates:
        print("  No symbols triggered trend-flip + RS>0 today.")
    else:
        for rank_i, (symbol, signal) in enumerate(candidates, 1):
            marker = "BUY " if rank_i <= free_slots else "skip"
            if rank_i <= free_slots:
                ref_price, qty = _sizing(symbol)
                sizing_str = f"  ~{qty} shares @ Rs {ref_price:,.2f} (Rs {qty * ref_price:,.0f})" if qty > 0 else "  slot too small for 1 share at this price"
            else:
                sizing_str = ""
            print(f"  {marker} #{rank_i:>3}  {symbol:12} RS-55 {signal.rank * 100:+.1f}%{sizing_str}")

    result = {
        "reference_date": reference_date.to_pydatetime(),
        "generated_at": datetime.now(timezone.utc),
        "held_before": sorted(held_symbols),
        "exits": exits,
        "capital": CAPITAL_DEFAULT,
        "max_positions": max_positions,
        "slot_size": slot_size,
        "free_slots_after_exits": free_slots,
        "to_buy_sized": [
            {"symbol": s, "ref_price": (p := _sizing(s))[0], "qty": p[1], "amount": round(p[1] * p[0], 2)}
            for s in to_buy
        ],
        "buy_candidates_ranked": [
            {
                "symbol": s,
                "rs55_pct": round(sig.rank * 100, 2),
                "close_price": float(frames[s]["Close"].loc[reference_date]),
            }
            for s, sig in candidates[:MAX_CANDIDATES_STORED]
        ],
        "to_buy": to_buy,
        "stale_symbols": sorted(stale),
    }

    database = db.get_db()
    database[SIGNALS_COLLECTION].update_one(
        {"reference_date": result["reference_date"]},
        {"$set": result},
        upsert=True,
    )
    print()
    print(f"  Saved to Atlas: {SIGNALS_COLLECTION} / reference_date={reference_date.date()}")
    print("=" * 70)
    print("  Nothing was traded. Update positions_daily.json yourself after you")
    print("  actually place these orders.")
    print("=" * 70)
    return result


if __name__ == "__main__":
    generate()
