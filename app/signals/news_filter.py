"""
News filter: fetches high-impact economic events from ForexFactory
and returns event times relevant to a given forex pair.
Cached in Redis for 1 hour to avoid hammering the feed.
"""
import json
import httpx
import asyncio
from datetime import datetime, timezone
from app.core.logger import logger

# ForexFactory public calendar JSON (this week)
FF_URL = "https://nfs.faireconomy.media/ff_calendar_thisweek.json"

# Pair -> currencies to watch
PAIR_CURRENCIES = {
    "EUR_USD": ["EUR", "USD"],
    "USD_JPY": ["USD", "JPY"],
    "GBP_USD": ["GBP", "USD"],
    "AUD_USD": ["AUD", "USD"],
    "XAU_USD": ["USD"],  # Gold is USD-driven
}

# Only block on high-impact events
HIGH_IMPACT = {"High"}


async def fetch_news_times(pair: str, redis_client=None) -> list[datetime]:
    """
    Returns list of high-impact event datetimes for the pair's currencies.
    Cached in Redis for 1 hour.
    """
    cache_key = f"news_filter:{pair}"

    # Try Redis cache first
    if redis_client:
        try:
            cached = await redis_client.get(cache_key)
            if cached:
                times = json.loads(cached)
                return [datetime.fromisoformat(t) for t in times]
        except Exception as e:
            logger.warning(f"Redis cache read failed: {e}")

    currencies = PAIR_CURRENCIES.get(pair, ["USD"])

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(FF_URL, headers={"User-Agent": "Mozilla/5.0"})
            resp.raise_for_status()
            events = resp.json()
    except Exception as e:
        logger.warning(f"News calendar fetch failed: {e} — news filter disabled for this cycle")
        return []

    news_times = []
    for event in events:
        try:
            if event.get("impact") not in HIGH_IMPACT:
                continue
            currency = event.get("country", "").upper()
            if currency not in currencies:
                continue
            date_str = event.get("date", "")
            if not date_str:
                continue
            # ForexFactory format: "2026-05-06T13:30:00-04:00"
            dt = datetime.fromisoformat(date_str).astimezone(timezone.utc).replace(tzinfo=None)
            news_times.append(dt)
        except Exception:
            continue

    logger.info(f"News filter: {len(news_times)} high-impact events for {pair} "
                f"({', '.join(currencies)})")

    # Cache for 1 hour
    if redis_client and news_times:
        try:
            serialized = json.dumps([t.isoformat() for t in news_times])
            await redis_client.setex(cache_key, 3600, serialized)
        except Exception as e:
            logger.warning(f"Redis cache write failed: {e}")

    return news_times
