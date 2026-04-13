"""
ForexAI Signals — FastAPI application entry point.
Includes the live signal loop that runs every closed candle.
"""
import asyncio
import os
import joblib
import pandas as pd
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import datetime

from app.api.routes_signals import router as signals_router
from app.db.session import init_db, AsyncSessionLocal
from app.db.models import Signal, SignalStatus
from app.data.ingest_oanda import fetch_candles
from app.features.indicators import build_features
from app.models.train_xgb import SignalPredictor
from app.signals.rules import generate_signal
from app.signals.publisher import publish_signal
from app.core.config import settings
from app.core.logger import logger

scheduler = AsyncIOScheduler()
predictor: SignalPredictor | None = None


def load_latest_model() -> SignalPredictor | None:
    model_dir = settings.MODEL_DIR
    if not os.path.exists(model_dir):
        logger.warning(f"Model dir not found: {model_dir}")
        return None

    model_files = [
        f for f in os.listdir(model_dir)
        if f.endswith(".joblib") and settings.ACTIVE_PAIRS[0].replace("/", "_") in f
    ]
    if not model_files:
        logger.warning("No trained model found. Run scripts/train.py first.")
        return None

    latest = sorted(model_files)[-1]
    path = os.path.join(model_dir, latest)
    logger.info(f"Loading model: {path}")
    return SignalPredictor(path)


async def run_signal_check():
    """
    Runs on each closed candle. Fetches latest candles,
    builds features, runs predictor, writes signal to DB.
    """
    global predictor
    if predictor is None:
        predictor = load_latest_model()
        if predictor is None:
            return

    for pair in settings.ACTIVE_PAIRS:
        try:
            df_raw = fetch_candles(pair, settings.ACTIVE_TIMEFRAME, count=200)
            if df_raw.empty:
                continue

            df = build_features(df_raw)
            if df.empty:
                continue

            latest_row = df.iloc[-1]
            now = datetime.utcnow()

            signal = generate_signal(latest_row, predictor, current_dt=now)
            if signal is None:
                logger.debug(f"No signal for {pair}")
                continue

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
                logger.info(f"Signal saved: {signal['direction']} {pair} conf={signal['confidence']:.2%}")

            await publish_signal(signal)

        except Exception as e:
            logger.error(f"Signal check error for {pair}: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    global predictor
    predictor = load_latest_model()

    # Run signal check every hour (on H1 timeframe)
    scheduler.add_job(run_signal_check, "cron", minute=1)   # 1 min after each hour
    scheduler.start()
    logger.info("ForexAI Signals started")

    yield

    scheduler.shutdown()
    logger.info("ForexAI Signals stopped")


app = FastAPI(
    title="ForexAI Signals API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://alphaforexai.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(signals_router, prefix="/api/v1")


@app.get("/api/v1/health")
async def health():
    return {
        "status": "ok",
        "model_loaded": predictor is not None,
        "pairs": settings.ACTIVE_PAIRS,
        "timeframe": settings.ACTIVE_TIMEFRAME,
    }
