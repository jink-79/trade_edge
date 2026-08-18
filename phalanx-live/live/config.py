"""Runtime config for the live infrastructure — loaded from `.env`
(gitignored, never committed). See `.env.example` for what's needed.

Deliberately separate from trade-edge-api's MONGODB_URI/DB_NAME (which
point at TradeEdge's own primary database) — this module is for the
phalanx Atlas cluster, a different database entirely, that trade-edge-api
only ever reads from.
"""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parent
load_dotenv(PROJECT_ROOT / ".env")  # no-op if .env doesn't exist yet

ATLAS_MONGODB_URI = os.getenv("ATLAS_MONGODB_URI", "")
ATLAS_DB_NAME = os.getenv("ATLAS_DB_NAME", "phalanx_algo")

RETENTION_DAYS = int(os.getenv("RETENTION_DAYS", "500"))
# ~2 years of daily bars — floor is 200 trading days (EMA200 warmup, the
# longest indicator involved; RS-55 and the trend state machine both
# settle well inside that). ~2.5x margin above the floor.


def require(name: str, value: str) -> str:
    """Fail loudly with a clear message if a required setting is missing,
    instead of a confusing downstream connection error."""
    if not value:
        raise RuntimeError(
            f"{name} is not set — copy live/.env.example to live/.env and fill it in. "
            f"See phalanx-live/README.md for where to get each value."
        )
    return value
