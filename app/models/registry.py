"""
Model registry: tracks all trained model versions in the DB,
activates the best-performing one, provides loading helpers.
"""
import os
import json
import joblib
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session

from app.db.models import ModelRun
from app.db.session import AsyncSessionLocal
from app.models.train_xgb import SignalPredictor
from app.core.config import settings
from app.core.logger import logger


async def register_model(meta: dict, db: AsyncSession = None):
    """Save a newly trained model's metadata to the DB."""
    avg = meta.get("avg_metrics", {})

    run = ModelRun(
        pair=meta["pair"],
        timeframe=meta["timeframe"],
        trained_at=datetime.utcnow(),
        win_rate=avg.get("win_rate"),
        expectancy=avg.get("expectancy"),
        max_drawdown=avg.get("max_drawdown"),
        sharpe=avg.get("sharpe"),
        profit_factor=avg.get("profit_factor"),
        total_trades=sum(
            r.get("n_trades", 0) for r in meta.get("walk_forward", [])
        ),
        model_path=meta["model_path"],
        is_active=False,
        notes=json.dumps(meta.get("top_features", [])),
    )

    close_db = False
    if db is None:
        db = AsyncSessionLocal()
        close_db = True

    try:
        db.add(run)
        await db.commit()
        await db.refresh(run)
        logger.info(f"Model registered: id={run.id} win_rate={run.win_rate:.2%}")
        return run.id
    finally:
        if close_db:
            await db.close()


async def activate_best_model(pair: str, timeframe: str, min_expectancy: float = 5.0):
    """
    Promote the model with the best walk-forward expectancy to active.
    Only activates if expectancy >= min_expectancy pips.
    """
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(ModelRun)
            .where(
                ModelRun.pair == pair,
                ModelRun.timeframe == timeframe,
                ModelRun.expectancy >= min_expectancy,
            )
            .order_by(ModelRun.expectancy.desc())
            .limit(1)
        )
        best = result.scalar_one_or_none()

        if not best:
            logger.warning(f"No qualifying model found for {pair} {timeframe} (min expectancy {min_expectancy})")
            return None

        # Deactivate all others
        all_runs = await db.execute(
            select(ModelRun).where(ModelRun.pair == pair, ModelRun.timeframe == timeframe)
        )
        for run in all_runs.scalars():
            run.is_active = (run.id == best.id)

        await db.commit()
        logger.info(f"Activated model id={best.id} expectancy={best.expectancy:.1f}pips path={best.model_path}")
        return best.model_path


async def get_active_model_path(pair: str, timeframe: str) -> str | None:
    """Returns model file path for the currently active model."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(ModelRun).where(
                ModelRun.pair == pair,
                ModelRun.timeframe == timeframe,
                ModelRun.is_active == True,
            )
        )
        run = result.scalar_one_or_none()
        if run:
            return run.model_path
    return None


async def load_active_predictor(pair: str = None, timeframe: str = None) -> SignalPredictor | None:
    pair = pair or settings.ACTIVE_PAIRS[0]
    timeframe = timeframe or settings.ACTIVE_TIMEFRAME

    # Try DB registry first
    path = await get_active_model_path(pair, timeframe)

    # Fall back to latest file in model dir
    if not path or not os.path.exists(path):
        model_dir = settings.MODEL_DIR
        if os.path.exists(model_dir):
            files = [
                f for f in os.listdir(model_dir)
                if f.endswith(".joblib") and pair.replace("/", "_") in f
            ]
            if files:
                path = os.path.join(model_dir, sorted(files)[-1])

    if not path or not os.path.exists(path):
        logger.warning(f"No model file found for {pair} {timeframe}")
        return None

    logger.info(f"Loading predictor from {path}")
    return SignalPredictor(path)


async def list_models(pair: str = None) -> list[dict]:
    """List all registered models with their metrics."""
    async with AsyncSessionLocal() as db:
        q = select(ModelRun).order_by(ModelRun.trained_at.desc())
        if pair:
            q = q.where(ModelRun.pair == pair)
        result = await db.execute(q)
        runs = result.scalars().all()
        return [
            {
                "id": r.id,
                "pair": r.pair,
                "timeframe": r.timeframe,
                "trained_at": r.trained_at.isoformat(),
                "win_rate": r.win_rate,
                "expectancy": r.expectancy,
                "profit_factor": r.profit_factor,
                "max_drawdown": r.max_drawdown,
                "sharpe": r.sharpe,
                "total_trades": r.total_trades,
                "is_active": r.is_active,
                "model_path": r.model_path,
            }
            for r in runs
        ]
