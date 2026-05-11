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
    import httpx as _httpx
    import datetime

    async def _tg(msg: str):
        try:
            url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
            async with _httpx.AsyncClient(timeout=10) as c:
                await c.post(url, json={"chat_id": settings.TELEGRAM_CHANNEL_ID, "text": msg, "parse_mode": "HTML"})
        except Exception as te:
            logger.warning(f"Telegram notify failed: {te}")

    try:
        from app.data.ingest_oanda import fetch_history
        from app.features.indicators import build_features
        from app.features.labels import make_trade_labels
        from app.models.train_xgb import train
        from app.models.registry import register_model, activate_best_model

        started = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
        await _tg(f"🤖 <b>Auto Retrain Started</b>\nTime: {started}\nPairs: {len(settings.ACTIVE_PAIRS)}")

        results = []
        for pair in settings.ACTIVE_PAIRS:
            logger.info(f"Retraining {pair}...")
            df_raw = fetch_history(pair, settings.ACTIVE_TIMEFRAME, years=5)
            if df_raw.empty:
                logger.error(f"No data for {pair}")
                results.append(f"❌ {pair}: no data")
                continue
            df = build_features(df_raw)
            # Use wider TP/SL for XAU (gold moves in dollars not micro-pips)
            _tp = 100 if "XAU" in pair else settings.TP_PIPS
            _sl = 50  if "XAU" in pair else settings.SL_PIPS
            df = make_trade_labels(df, tp_pips=_tp, sl_pips=_sl, pair=pair)
            df = df.dropna(subset=["label_binary"])
            if df.empty:
                logger.error(f"No valid labels for {pair} after dropna")
                results.append(f"❌ {pair}: no valid labels")
                continue
            meta = train(df, pair=pair, timeframe=settings.ACTIVE_TIMEFRAME)
            await register_model(meta)
            await activate_best_model(pair, settings.ACTIVE_TIMEFRAME)
            acc = meta.get("avg_metrics", {}).get("win_rate", 0) or 0
            logger.info(f"Retrain complete for {pair}")
            results.append(f"✅ {pair}: {acc:.1%} acc")

        # Cleanup: keep only 2 most recent models per pair
        import glob, os
        models_dir = "/opt/forexai/models/saved"
        deleted = 0
        for p in settings.ACTIVE_PAIRS:
            bases = sorted(set(f.replace(".joblib","").replace("_meta.json","") for f in glob.glob(os.path.join(models_dir, f"{p}_H1_*"))))
            for base in bases[:-2]:
                for ext in [".joblib", "_meta.json"]:
                    _f = os.path.join(models_dir, base + ext)
                    if os.path.exists(_f):
                        try:
                            os.remove(_f)
                            deleted += 1
                        except Exception:
                            pass
                    os.remove(f)
                    deleted += 1
                except Exception:
                    pass
        if deleted:
            logger.info(f"Cleaned up {deleted} old model files")

        summary = "\n".join(results)
        await _tg(f"✅ <b>Auto Retrain Complete</b>\n\n{summary}\n🗑 Cleaned {deleted} old models")

    except Exception as e:
        import traceback; traceback.print_exc()
        import traceback; traceback.print_exc()
        logger.error(f"Retrain failed: {e}", exc_info=True)
        await _tg(f"🚨 <b>Auto Retrain FAILED</b>\n<code>{e}</code>")

