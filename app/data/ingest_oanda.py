"""
Data ingest from OANDA v20 REST API.
Free demo account: https://developer.oanda.com/
Set OANDA_API_KEY and OANDA_ACCOUNT_ID in .env
"""
import pandas as pd
import httpx
from datetime import datetime, timedelta
from typing import Optional
from app.core.config import settings
from app.core.logger import logger

OANDA_BASE = {
    "practice": "https://api-fxpractice.oanda.com",
    "live":     "https://api-fxtrade.oanda.com",
}

TIMEFRAME_MAP = {
    "M1":  "M1",
    "M5":  "M5",
    "M15": "M15",
    "H1":  "H1",
    "H4":  "H4",
    "D1":  "D",
}


def _headers() -> dict:
    return {
        "Authorization": f"Bearer {settings.OANDA_API_KEY}",
        "Content-Type": "application/json",
    }


def fetch_candles(
    pair: str,
    timeframe: str = "H1",
    count: int = 500,
    from_dt: Optional[datetime] = None,
    to_dt: Optional[datetime] = None,
) -> pd.DataFrame:
    """
    Fetch OHLCV candles from OANDA.
    pair example: "EUR_USD"
    Returns DataFrame with columns: time, open, high, low, close, volume
    """
    base = OANDA_BASE[settings.OANDA_ENV]
    gran = TIMEFRAME_MAP.get(timeframe, "H1")
    url = f"{base}/v3/instruments/{pair}/candles"

    params: dict = {
        "granularity": gran,
        "price": "M",   # midpoint (bid/ask average)
    }

    if from_dt and to_dt:
        params["from"] = from_dt.strftime("%Y-%m-%dT%H:%M:%S.000000000Z")
        params["to"]   = to_dt.strftime("%Y-%m-%dT%H:%M:%S.000000000Z")
    else:
        params["count"] = count

    with httpx.Client(timeout=60) as client:
        resp = client.get(url, headers=_headers(), params=params)
        resp.raise_for_status()
        data = resp.json()

    candles = data.get("candles", [])
    if not candles:
        logger.warning(f"No candles returned for {pair} {timeframe}")
        return pd.DataFrame()

    records = []
    for c in candles:
        if not c.get("complete", True):
            continue
        mid = c["mid"]
        records.append({
            "time":   pd.to_datetime(c["time"]).tz_localize(None),
            "open":   float(mid["o"]),
            "high":   float(mid["h"]),
            "low":    float(mid["l"]),
            "close":  float(mid["c"]),
            "volume": float(c["volume"]),
        })

    df = pd.DataFrame(records)
    logger.info(f"Fetched {len(df)} candles for {pair} {timeframe}")
    return df


def fetch_history(
    pair: str,
    timeframe: str = "H1",
    years: int = 3,
) -> pd.DataFrame:
    """
    Fetch multi-year history in 500-candle chunks (OANDA limit).
    """
    all_frames = []
    end = datetime.utcnow()

    # Step back one chunk at a time
    gran_hours = {"M1": 1/60, "M5": 5/60, "M15": 15/60, "H1": 1, "H4": 4, "D1": 24}
    hours_per_candle = gran_hours.get(timeframe, 1)
    chunk_hours = int(500 * hours_per_candle)

    start = end - timedelta(days=years * 365)
    current = start

    while current < end:
        chunk_end = min(current + timedelta(hours=chunk_hours), end)
        df = fetch_candles(pair, timeframe, from_dt=current, to_dt=chunk_end)
        if not df.empty:
            all_frames.append(df)
        current = chunk_end

    if not all_frames:
        return pd.DataFrame()

    result = pd.concat(all_frames).drop_duplicates("time").sort_values("time").reset_index(drop=True)
    logger.info(f"Total history for {pair} {timeframe}: {len(result)} candles")
    return result
