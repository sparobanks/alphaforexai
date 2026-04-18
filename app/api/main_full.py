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
from app.signals.publisher    import publish_signal
from app.signals.tracker      import run_tracker
from app.signals.weekly_digest import send_weekly_digest
from app.trading.auto_trade import run_auto_trading
from app.core.config          import settings
from app.core.logger          import logger

scheduler = AsyncIOScheduler()
_scheduler_started = False
predictor = None


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
    global predictor
    if predictor is None:
        predictor = await load_active_predictor()
        if predictor is None:
            logger.warning("No active model loaded — skipping signal check")
            return

    PRIMARY_PAIR = "EUR_USD"

    for pair in settings.ACTIVE_PAIRS:
        try:
            is_primary = (pair == PRIMARY_PAIR)

            df_raw = fetch_candles(pair, settings.ACTIVE_TIMEFRAME, count=200)
            if df_raw.empty:
                continue
            df = build_features(df_raw)
            if df.empty:
                continue

            latest_row = df.iloc[-1]
            signal = generate_signal(latest_row, predictor, current_dt=datetime.utcnow(), pair=pair)

            if signal is None:
                continue

            # Tag non-primary pairs as VIP only
            signal["pair"] = pair.replace("_", "/")
            signal["vip_only"] = not is_primary

            async with AsyncSessionLocal() as db:
                db_signal = Signal(
                    pair=signal["pair"],
                    timeframe=signal["timeframe"],
                    direction=signal["direction"],
                    entry_price=signal["entry"],
                    sl_price=signal["sl"],
                    tp_price=signal["tp"],
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
            await run_auto_trading(signal)

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
    scheduler.add_job(run_signal_check, "cron", minute=1)
    # Trade tracker: every 15 minutes
    scheduler.add_job(run_tracker, "interval", minutes=15)
    # Weekly digest every Monday at 8am UTC
    scheduler.add_job(send_weekly_digest, "cron", day_of_week="mon", hour=8, minute=0)
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
