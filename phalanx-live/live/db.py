"""MongoDB Atlas connection — the phalanx live data store, separate from
TradeEdge's own primary database. trade-edge-api reads `daily_signals`
from this same cluster (read-only) via its own connection
(trade-edge-api/src/config/phalanx-db.ts) — same collection name, so no
schema translation is needed on either side.
"""

from __future__ import annotations

from functools import lru_cache

from pymongo import ASCENDING, MongoClient

import config

OHLCV = "ohlcv"
SYMBOLS = "symbols"
DAILY_SIGNALS = "daily_signals"


@lru_cache(maxsize=1)
def get_client() -> MongoClient:
    uri = config.require("ATLAS_MONGODB_URI", config.ATLAS_MONGODB_URI)
    return MongoClient(uri, serverSelectionTimeoutMS=5000)


def get_db():
    return get_client()[config.ATLAS_DB_NAME]


def ping() -> str:
    """Raise if Atlas is unreachable; return its version on success."""
    return get_client().server_info().get("version", "?")


def ensure_indexes():
    db = get_db()
    db[OHLCV].create_index(
        [("symbol", ASCENDING), ("timeframe", ASCENDING), ("date", ASCENDING)],
        unique=True,
        name="sym_tf_date",
    )
    db[SYMBOLS].create_index([("symbol", ASCENDING)], unique=True, name="symbol")
    db[DAILY_SIGNALS].create_index([("reference_date", ASCENDING)], unique=True, name="reference_date")
    return db
