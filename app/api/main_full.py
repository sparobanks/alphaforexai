from app.api.routes_blog import router as blog_router
"""
ForexAI Signals — complete FastAPI application.
"""
import os
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.api.routes_signals  import router as signals_router
from app.api.routes_auth     import router as auth_router, require_tier
from app.api.routes_payments  import router as payments_router
from app.api.routes_models    import router as models_router
from app.db.session           import init_db, AsyncSessionLocal
from app.db.models            import Signal, SignalStatus
from app.data.ingest_oanda    import fetch_candles
from app.features.indicators  import build_features
from app.models.registry      import load_active_predictor
from app.signals.rules        import generate_signal
from app.signals.news_filter   import fetch_news_times
from app.signals.publisher    import publish_signal
from app.signals.tracker      import run_tracker
from app.signals.weekly_digest import send_weekly_digest
from app.api.routes_models    import _retrain_task
from app.trading.auto_trade import run_auto_trading
from app.core.config          import settings
from app.core.logger          import logger

scheduler = AsyncIOScheduler()
_scheduler_started = False
predictors = {}


_signal_check_running = False

async def run_signal_check():
    global _signal_check_running
    if _signal_check_running:
        logger.warning("Signal check already running, skipping")
        return
    _signal_check_running = True
    try:
        await _run_signal_check_inner()
    finally:
        _signal_check_running = False

async def _run_signal_check_inner():
    global predictors
    if not predictors:
        predictors = {}
    PRIMARY_PAIR = "EUR_USD"

    # Fetch FF calendar once per cycle — avoids 429 rate limit
    _all_news = {}
    try:
        import httpx as _hx
        from app.signals.news_filter import PAIR_CURRENCIES, HIGH_IMPACT
        from datetime import timezone as _tz
        async with _hx.AsyncClient(timeout=10) as _hc:
            _ff = await _hc.get("https://nfs.faireconomy.media/ff_calendar_thisweek.json", headers={"User-Agent": "Mozilla/5.0"})
            _ff_data = _ff.json() if _ff.status_code == 200 else []
        for _p in settings.ACTIVE_PAIRS:
            _cur = PAIR_CURRENCIES.get(_p, ["USD"])
            _times = []
            for _ev in _ff_data:
                if _ev.get("impact") not in HIGH_IMPACT: continue
                if _ev.get("country", "").upper() not in _cur: continue
                try:
                    _dt = datetime.fromisoformat(_ev["date"]).astimezone(_tz.utc).replace(tzinfo=None)
                    _times.append(_dt)
                except Exception: pass
            _all_news[_p] = _times
        logger.info(f"News calendar: {sum(len(v) for v in _all_news.values())} events loaded")
    except Exception as _ne:
        logger.warning(f"News calendar fetch failed: {_ne}")

    for pair in settings.ACTIVE_PAIRS:
        try:
            is_primary = (pair == PRIMARY_PAIR)
            if pair not in predictors or predictors[pair] is None:
                predictors[pair] = await load_active_predictor(pair, settings.ACTIVE_TIMEFRAME)
            predictor = predictors[pair]
            if predictor is None:
                logger.warning(f"No model for {pair} — skipping")
                continue
            df_raw = fetch_candles(pair, settings.ACTIVE_TIMEFRAME, count=200)
            if df_raw.empty:
                continue
            df = build_features(df_raw)
            if df.empty:
                continue
            latest_row = df.iloc[-1]
            # Fetch high-impact news times for this pair (no Redis cache needed at 30min interval)
            news_times = _all_news.get(pair, [])
            now = datetime.utcnow()
            signal = generate_signal(latest_row, predictor, current_dt=now, news_times=news_times, pair=pair)

            if signal is None:
                continue

            # Tag non-primary pairs as VIP only
            signal["pair"] = pair.replace("_", "/")
            signal["vip_only"] = not is_primary

            async with AsyncSessionLocal() as db:
                # Skip if open signal already exists for this pair
                from sqlalchemy import select as _sel
                existing = await db.execute(
                    _sel(Signal).where(
                        Signal.pair == pair.replace("_", "/"),
                        Signal.status == SignalStatus.OPEN,
                    )
                )
                if existing.scalars().first() is not None:
                    logger.debug(f"Skipping {pair} — open signal already exists")
                    continue

                # Calculate TP1/TP2/TP3 based on actual SL/TP distance
                from app.trading.auto_trade import PIP_SIZES
                pip_val = PIP_SIZES.get(pair.replace("/", "_"), 0.0001)
                sign = 1 if signal["direction"] == "BUY" else -1
                decimals = 3 if pip_val >= 0.01 else 5
                _tp_dist = abs(signal["tp"] - signal["entry"])
                _sl_dist = abs(signal["sl"] - signal["entry"])
                tp1 = round(signal["entry"] + sign * _tp_dist * 0.33, decimals)
                tp2 = round(signal["entry"] + sign * _tp_dist * 0.66, decimals)
                tp3 = round(signal["tp"], decimals)
                signal["tp1"] = tp1
                signal["tp2"] = tp2
                signal["tp3"] = tp3

                db_signal = Signal(
                    pair=signal["pair"],
                    timeframe=signal["timeframe"],
                    direction=signal["direction"],
                    entry_price=signal["entry"],
                    sl_price=signal["sl"],
                    tp_price=signal["tp"],
                    tp1_price=signal.get("tp1"),
                    tp2_price=signal.get("tp2"),
                    tp3_price=signal.get("tp3"),
                    rr_ratio=signal["rr_ratio"],
                    confidence=signal["confidence"],
                    risk_pct=signal["risk_pct"],
                    reason=signal["reason"],
                    expires_at=signal["expires_at"],
                    status=SignalStatus.OPEN,
                )
                db.add(db_signal)
                await db.commit()
                logger.info(f"Signal: {signal['direction']} {pair} conf={signal['confidence']:.0%} vip_only={signal['vip_only']}")

            from app.signals.publisher import get_pro_vip_emails, get_vip_emails
            if is_primary:
                recipients = await get_pro_vip_emails()
            else:
                recipients = await get_vip_emails()
            await publish_signal(signal, email_recipients=recipients)
            trade_result = await run_auto_trading(signal)
            # Save trade IDs to signal for SL tracking
            if trade_result and trade_result.get("trade_ids"):
                import json
                async with AsyncSessionLocal() as db2:
                    from sqlalchemy import update as sa_update
                    await db2.execute(
                        sa_update(Signal)
                        .where(Signal.pair == signal["pair"], Signal.status == SignalStatus.OPEN)
                        .values(trade_ids=json.dumps(trade_result["trade_ids"]))
                    )
                    await db2.commit()

        except Exception as e:
            logger.error(f"Signal check error ({pair}): {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()

    global predictors
    predictors = {}
    for pair in settings.ACTIVE_PAIRS:
        p = await load_active_predictor(pair, settings.ACTIVE_TIMEFRAME)
        if p:
            predictors[pair] = p
    if predictors:
        logger.info("Model loaded successfully")
    else:
        logger.warning("No model loaded — run scripts/train.py first")

    # Signal check: every hour at :01
    scheduler.add_job(run_signal_check, "interval", minutes=30)
    # Trade tracker: every 15 minutes
    scheduler.add_job(run_tracker, "interval", minutes=15)
    # Weekly digest every Monday at 8am UTC
    scheduler.add_job(send_weekly_digest, "cron", day_of_week="mon", hour=8, minute=0)
    # Auto model retrain every Sunday at 2am UTC (markets closed)
    scheduler.add_job(_retrain_task, "cron", day_of_week="sun", hour=2, minute=0)
    scheduler.start()
    logger.info("ForexAI Signals API started")

    yield

    scheduler.shutdown()


app = FastAPI(
    title="ForexAI Signals API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://alphaforexai.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Public routes
app.include_router(auth_router,     prefix="/api/v1")
app.include_router(payments_router, prefix="/api/v1")
app.include_router(blog_router, prefix="/api/v1")

# Protected routes (tier-gated in individual endpoints)
app.include_router(signals_router,  prefix="/api/v1")
app.include_router(models_router,   prefix="/api/v1")


@app.get("/api/v1/health")
async def health():
    return {
        "status": "ok",
        "model_loaded": len(predictors) > 0,
        "pairs": settings.ACTIVE_PAIRS,
        "timeframe": settings.ACTIVE_TIMEFRAME,
        "time": datetime.utcnow().isoformat(),
    }


# ── Tier-gated signal endpoints ───────────────────────────────────────────────
# Free:  /signals/latest  (limited, no SL/TP in response)
# Pro:   /signals/history, /signals/stats/summary
# VIP:   /signals/performance, /models/

# Example of gating inside a route — add to routes_signals.py as needed:
#
# @router.get("/full-details/{signal_id}")
# async def get_full_signal(
#     signal_id: int,
#     user = Depends(require_tier("pro", "vip")),
#     db: AsyncSession = Depends(get_db),
# ):
#     ...
