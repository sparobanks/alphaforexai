from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.registry import list_models, activate_best_model
from app.core.config import settings
from app.core.logger import logger

router = APIRouter(prefix="/models", tags=["models"])


@router.get("/")
async def get_models(pair: str = None):
    """List all trained model versions with their metrics."""
    return await list_models(pair)


@router.post("/{model_id}/activate")
async def activate_model(model_id: int, db: AsyncSession = Depends(get_db)):
    """Manually activate a specific model version."""
    from sqlalchemy import select, update
    from app.db.models import ModelRun

    # Deactivate all
    all_runs = await db.execute(select(ModelRun))
    for run in all_runs.scalars():
        run.is_active = (run.id == model_id)
    await db.commit()
    return {"activated": model_id}


@router.post("/auto-activate")
async def auto_activate(pair: str = "EUR_USD", timeframe: str = "H1"):
    """Activate the best-performing model by expectancy."""
    path = await activate_best_model(pair, timeframe)
    if not path:
        raise HTTPException(404, "No qualifying model found")
    return {"activated_model": path}


@router.post("/retrain")
async def trigger_retrain(background_tasks: BackgroundTasks):
    """Trigger a full model retrain in the background."""
    background_tasks.add_task(_retrain_task)
    return {"status": "retrain started"}


async def _retrain_task():
    """Background retrain: fetch fresh data, retrain, register, auto-activate."""
    try:
        from app.data.ingest_oanda import fetch_history
        from app.features.indicators import build_features
        from app.features.labels import make_trade_labels
        from app.models.train_xgb import train
        from app.models.registry import register_model, activate_best_model

        for pair in settings.ACTIVE_PAIRS:
            logger.info(f"Retraining {pair}...")
            df_raw = fetch_history(pair, settings.ACTIVE_TIMEFRAME, years=5)
            if df_raw.empty:
                logger.error(f"No data for {pair}")
                continue

            df = build_features(df_raw)
            df = make_trade_labels(df, tp_pips=settings.TP_PIPS, sl_pips=settings.SL_PIPS)
            meta = train(df, pair=pair, timeframe=settings.ACTIVE_TIMEFRAME)

            await register_model(meta)
            await activate_best_model(pair, settings.ACTIVE_TIMEFRAME)
            logger.info(f"Retrain complete for {pair}")

    except Exception as e:
        logger.error(f"Retrain failed: {e}")
