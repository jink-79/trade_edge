"""Retention trim for DAILY OHLCV — keeps only the last RETENTION_DAYS of
history per symbol in the live Atlas store. Dry-run by default.

Run:
    python -m live.retention_daily              # dry run, reports counts only
    python -m live.retention_daily --execute    # actually deletes
"""

from __future__ import annotations

import argparse
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import config
import db


CALENDAR_DAYS_PER_TRADING_DAY = 365.25 / 252  # NSE runs ~252 sessions/year


def trim(retention_days: int, dry_run: bool = True) -> dict:
    """retention_days is in TRADING days (matching SEED_BARS in
    update_daily.py) -- converted to a calendar-day cutoff since Mongo
    stores calendar dates and trading-day gaps (weekends/holidays) aren't
    tracked per-symbol."""
    database = db.get_db()
    calendar_days = round(retention_days * CALENDAR_DAYS_PER_TRADING_DAY)
    cutoff = datetime.now(timezone.utc) - timedelta(days=calendar_days)

    query = {"timeframe": "daily", "date": {"$lt": cutoff}}

    if dry_run:
        count = database[db.OHLCV].count_documents(query)
        return {"cutoff": cutoff.isoformat(), "would_delete": count, "deleted": 0, "dry_run": True}

    result = database[db.OHLCV].delete_many(query)
    return {"cutoff": cutoff.isoformat(), "would_delete": 0, "deleted": result.deleted_count, "dry_run": False}


def main() -> int:
    ap = argparse.ArgumentParser(description="Trim daily OHLCV history older than the retention window.")
    ap.add_argument("--execute", action="store_true", help="actually delete (default is dry-run, reports only)")
    ap.add_argument("--days", type=int, default=config.RETENTION_DAYS, help="retention window in trading days")
    args = ap.parse_args()

    print("=" * 66)
    print(f"  DAILY RETENTION TRIM {'(EXECUTING — will delete)' if args.execute else '(DRY RUN — reports only)'}")
    print("=" * 66)
    print(f"  retention window: {args.days} days")

    summary = trim(args.days, dry_run=not args.execute)

    print(f"  cutoff date     : {summary['cutoff']}")
    if summary["dry_run"]:
        print(f"  would delete    : {summary['would_delete']} documents")
        print("  (re-run with --execute to actually delete)")
    else:
        print(f"  deleted         : {summary['deleted']} documents")
    return 0


if __name__ == "__main__":
    sys.exit(main())
