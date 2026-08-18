"""Incremental DAILY OHLCV updater for the live Atlas store. Seeds
~550 daily bars (RETENTION_DAYS + a buffer -- see config.py for the
sizing rationale) on first run for any symbol; every run after that
only fetches the missing days.

Run:
    python -m live.update_daily                  # all tracked symbols
    python -m live.update_daily --symbols RELIANCE,TCS
    python -m live.update_daily --limit 5         # smoke test
"""

from __future__ import annotations

import argparse
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import pandas as pd
from pymongo import UpdateOne
from tvDatafeed import Interval, TvDatafeed

import config
import db

INTERVAL = Interval.in_daily
TIMEFRAME = "daily"
SEED_BARS = config.RETENTION_DAYS + 50  # comfortable buffer above the retention window
EXCHANGE = "NSE"
DEFAULT_BUFFER_DAYS = 3
NIFTY_SYMBOL = "NIFTY"


def _tv_symbol_candidates(symbol: str):
    seen = set()
    for cand in (
        symbol,
        symbol.replace("&", "_").replace("-", "_"),
        symbol.replace("-", "_"),
        symbol.replace("&", "_"),
    ):
        if cand not in seen:
            seen.add(cand)
            yield cand


def _is_complete_daily(bar_date: pd.Timestamp, now: pd.Timestamp) -> bool:
    return bar_date.normalize() < now.normalize()


def last_bar(database, symbol: str):
    doc = database[db.OHLCV].find_one(
        {"symbol": symbol, "timeframe": TIMEFRAME},
        sort=[("date", -1)],
        projection={"date": 1, "is_complete": 1},
    )
    if not doc:
        return None, None
    return pd.Timestamp(doc["date"]), bool(doc.get("is_complete"))


def _build_daily_docs(symbol: str, df: pd.DataFrame, now_local: pd.Timestamp, updated_at: datetime) -> list[dict]:
    docs = []
    for ts, row in df.iterrows():
        ts = pd.Timestamp(ts).normalize()
        docs.append(
            {
                "symbol": symbol,
                "timeframe": TIMEFRAME,
                "date": ts.to_pydatetime(),
                "open": float(row["open"]),
                "high": float(row["high"]),
                "low": float(row["low"]),
                "close": float(row["close"]),
                "volume": float(row["volume"]),
                "is_complete": _is_complete_daily(ts, now_local),
                "updated_at": updated_at,
            }
        )
    return docs


def _fetch_n(tv: TvDatafeed, symbol: str, n_bars: int):
    for cand in _tv_symbol_candidates(symbol):
        try:
            df = tv.get_hist(symbol=cand, exchange=EXCHANGE, interval=INTERVAL, n_bars=n_bars)
        except Exception:
            df = None
        if df is not None and len(df):
            return df
    return None


def update(
    symbols: list[str] | None = None, buffer_days: int = DEFAULT_BUFFER_DAYS, tv: TvDatafeed | None = None, verbose: bool = True
) -> dict:
    db.ensure_indexes()
    database = db.get_db()

    if symbols is None:
        symbols = [d["symbol"] for d in database[db.SYMBOLS].find({"tracked": True}, {"symbol": 1})]
    if NIFTY_SYMBOL not in symbols:
        symbols = [*symbols, NIFTY_SYMBOL]

    if tv is None:
        tv = TvDatafeed()

    now = datetime.now(timezone.utc)
    now_ts = pd.Timestamp.now()
    failed, new_bars, seeded, updated, uptodate = [], 0, 0, 0, 0

    for i, symbol in enumerate(symbols, 1):
        last, last_ok = last_bar(database, symbol)

        if last is None:
            n = SEED_BARS
        else:
            if last.normalize() >= now_ts.normalize() - pd.Timedelta(days=1) and last_ok:
                uptodate += 1
                if verbose:
                    print(f"  [{i:>3}/{len(symbols)}] ok  {symbol:14} up-to-date: {last.date()}", flush=True)
                continue
            gap_days = max(0, (now_ts.normalize() - last.normalize()).days)
            n = gap_days + buffer_days

        df = _fetch_n(tv, symbol, n)
        if df is None:
            failed.append(symbol)
            if verbose:
                print(f"  [{i:>3}/{len(symbols)}] FAIL {symbol}", flush=True)
            continue

        docs = _build_daily_docs(symbol, df, now_ts, now)
        if not docs:
            uptodate += 1
            continue
        ops = [
            UpdateOne(
                {"symbol": d["symbol"], "timeframe": d["timeframe"], "date": d["date"]},
                {"$set": d},
                upsert=True,
            )
            for d in docs
        ]
        database[db.OHLCV].bulk_write(ops, ordered=False)

        newn = len([d for d in docs if last is None or pd.Timestamp(d["date"]) > last])
        new_bars += newn
        newest = pd.Timestamp(docs[-1]["date"])
        if last is None:
            seeded += 1
            tag = f"seeded {len(docs)} bars -> {newest.date()}"
        else:
            updated += 1
            tag = f"+{newn} new -> {newest.date()}"
        if verbose:
            print(f"  [{i:>3}/{len(symbols)}] ok  {symbol:14} {tag}", flush=True)

    if failed:
        database[db.SYMBOLS].update_many({"symbol": {"$in": failed}}, {"$set": {"ingest_failed": True, "ingest_checked_at": now}})

    return {
        "symbols": len(symbols),
        "seeded": seeded,
        "updated": updated,
        "uptodate": uptodate,
        "failed": failed,
        "new_bars": new_bars,
    }


def main() -> int:
    ap = argparse.ArgumentParser(description="Incremental daily OHLCV updater (tvdatafeed -> Atlas).")
    ap.add_argument("--symbols", default="", help="comma list; default = all tracked symbols")
    ap.add_argument("--limit", type=int, default=0, help="only the first N tracked symbols (smoke test)")
    ap.add_argument("--buffer", type=int, default=DEFAULT_BUFFER_DAYS, help="re-fetch N recent bars as a safety margin")
    args = ap.parse_args()

    symbols = None
    if args.symbols:
        symbols = [s.strip().upper() for s in args.symbols.split(",") if s.strip()]
    elif args.limit:
        database = db.get_db()
        symbols = [d["symbol"] for d in database[db.SYMBOLS].find({"tracked": True}, {"symbol": 1}).limit(args.limit)]

    print("=" * 66)
    print("  LIVE UPDATE — incremental DAILY OHLCV (tvdatafeed -> Atlas)")
    print("=" * 66)
    print(f"  started : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("-" * 66)

    summary = update(symbols=symbols, buffer_days=args.buffer)

    print("-" * 66)
    print(f"  symbols   : {summary['symbols']}")
    print(f"  seeded    : {summary['seeded']}   (had no data)")
    print(f"  updated   : {summary['updated']}   (+{summary['new_bars']} new bars)")
    print(f"  up-to-date: {summary['uptodate']}")
    print(f"  failed    : {len(summary['failed'])}")
    if summary["failed"]:
        print(f"              {', '.join(summary['failed'])}")
    print(f"  finished  : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    if summary["seeded"]:
        print()
        print(f"  {summary['seeded']} symbol(s) got a full history seed — run")
        print(f"  'python -m live.retention_daily --execute' to trim to the retention window.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
