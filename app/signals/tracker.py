"""
Performance tracker: runs periodically to close open signals
by checking whether price hit TP or SL, and updates daily stats.
"""
import asyncio
from datetime import datetime, timedelta, date, timezone
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.db.session import AsyncSessionLocal
from app.db.models import Signal, SignalStatus, Performance
from app.data.ingest_oanda import fetch_candles
from app.core.config import settings
from app.core.logger import logger


async def close_expired_signals(db: AsyncSession):
    """Mark signals as EXPIRED if past their expiry time and still OPEN."""
    now = datetime.utcnow()
    result = await db.execute(
        select(Signal).where(
            Signal.status == SignalStatus.OPEN,
            Signal.expires_at <= now,
        )
    )
    expired = result.scalars().all()
    for s in expired:
        s.status = SignalStatus.EXPIRED
        s.closed_at = datetime.utcnow().replace(tzinfo=timezone.utc)
        s.pnl_pips = 0.0
    if expired:
        await db.commit()
        logger.info(f"Expired {len(expired)} signals")


async def adjust_sl_on_oanda(signal: Signal, new_sl: float):
    """Move SL on all open OANDA trades for this signal."""
    if not signal.trade_ids:
        return
    try:
        import json
        from app.trading.auto_trade import modify_trade_sl
        from app.db.session import AsyncSessionLocal as _ASL
        # Get user credentials
        async with _ASL() as db2:
            from app.db.models import User
            from sqlalchemy import select as sa_select
            users = await db2.execute(
                sa_select(User).where(User.auto_trade_enabled == True, User.tier == "vip")
            )
            for user in users.scalars().all():
                trade_id_list = json.loads(signal.trade_ids)
                for tid in trade_id_list:
                    if tid:
                        await modify_trade_sl(
                            user.oanda_account_id, user.oanda_api_key,
                            str(tid), new_sl, user.oanda_is_live
                        )
                        logger.info(f"Moved SL to {new_sl} for trade {tid}")
    except Exception as e:
        logger.error(f"SL adjustment failed: {e}")


async def check_open_signals(db: AsyncSession, pair: str, pip_size: float = 0.0001):
    """
    Fetch recent candles and check if any open signals hit TP or SL.
    Also checks TP1/TP2 hits and adjusts SL automatically.
    """
    result = await db.execute(
        select(Signal).where(
            Signal.status == SignalStatus.OPEN,
            Signal.pair == pair.replace("_", "/"),
        )
    )
    open_signals = result.scalars().all()
    if not open_signals:
        return

    # Fetch last 50 candles to check against
    df = fetch_candles(pair, settings.ACTIVE_TIMEFRAME, count=50)
    if df.empty:
        return

    tp_pips = settings.TP_PIPS
    sl_pips = settings.SL_PIPS
    now = datetime.utcnow()
    closed_signals = []

    for signal in open_signals:
        # Only look at candles after signal creation
        signal_time = signal.created_at.replace(tzinfo=None) if signal.created_at.tzinfo else signal.created_at
        candles_after = df[df["time"] > signal_time]
        if candles_after.empty:
            continue

        for _, candle in candles_after.iterrows():
            h = candle["high"]
            l = candle["low"]

            if signal.direction == "BUY":
                if h >= signal.tp_price:
                    # Check TP1 hit - move SL to breakeven
                    if signal.tp1_price and not signal.tp1_hit:
                        tp1_hit = (signal.direction == "BUY" and high >= signal.tp1_price) or                                   (signal.direction == "SELL" and low <= signal.tp1_price)
                        if tp1_hit:
                            signal.tp1_hit = True
                            await adjust_sl_on_oanda(signal, signal.entry_price)
                            logger.info(f"TP1 hit for {signal.pair} - SL moved to breakeven {signal.entry_price}")

                    # Check TP2 hit - move SL to TP1
                    if signal.tp2_price and signal.tp1_hit and not signal.tp2_hit:
                        tp2_hit = (signal.direction == "BUY" and high >= signal.tp2_price) or                                   (signal.direction == "SELL" and low <= signal.tp2_price)
                        if tp2_hit:
                            signal.tp2_hit = True
                            if signal.tp1_price:
                                await adjust_sl_on_oanda(signal, signal.tp1_price)
                                logger.info(f"TP2 hit for {signal.pair} - SL moved to TP1 {signal.tp1_price}")

                    signal.status = SignalStatus.TP_HIT
                    signal.pnl_pips = tp_pips
                    signal.closed_at = datetime.utcnow().replace(tzinfo=timezone.utc)
                    closed_signals.append({"pair": signal.pair, "direction": signal.direction, "status": "TP_HIT", "pnl_pips": tp_pips, "confidence": signal.confidence})
                    break
                elif l <= signal.sl_price:
                    signal.status = SignalStatus.SL_HIT
                    signal.pnl_pips = -sl_pips
                    signal.closed_at = datetime.utcnow().replace(tzinfo=timezone.utc)
                    closed_signals.append({"pair": signal.pair, "direction": signal.direction, "status": "SL_HIT", "pnl_pips": -sl_pips, "confidence": signal.confidence})
                    break
            else:  # SELL
                if l <= signal.tp_price:
                    signal.status = SignalStatus.TP_HIT
                    signal.pnl_pips = tp_pips
                    signal.closed_at = datetime.utcnow().replace(tzinfo=timezone.utc)
                    closed_signals.append({"pair": signal.pair, "direction": signal.direction, "status": "TP_HIT", "pnl_pips": tp_pips, "confidence": signal.confidence})
                    break
                elif h >= signal.sl_price:
                    signal.status = SignalStatus.SL_HIT
                    signal.pnl_pips = -sl_pips
                    signal.closed_at = datetime.utcnow().replace(tzinfo=timezone.utc)
                    closed_signals.append({"pair": signal.pair, "direction": signal.direction, "status": "SL_HIT", "pnl_pips": -sl_pips, "confidence": signal.confidence})
                    break

    await db.commit()
    # Send Telegram alerts for closed signals
    for cs in closed_signals:
        try:
            from app.signals.publisher import send_close_alert
            await send_close_alert(cs)
        except Exception as _e:
            pass


async def update_daily_performance(db: AsyncSession, pair: str, for_date: date = None):
    """Aggregate closed signals into the Performance table for the given date."""
    for_date = for_date or datetime.utcnow().date()
    day_start = datetime.combine(for_date, datetime.min.time())
    day_end   = day_start + timedelta(days=1)

    result = await db.execute(
        select(Signal).where(
            Signal.pair == pair.replace("_", "/"),
            Signal.created_at >= day_start,
            Signal.created_at < day_end,
            Signal.status != SignalStatus.OPEN,
        )
    )
    day_signals = result.scalars().all()
    if not day_signals:
        return

    tp_count  = sum(1 for s in day_signals if s.status == SignalStatus.TP_HIT)
    sl_count  = sum(1 for s in day_signals if s.status == SignalStatus.SL_HIT)
    exp_count = sum(1 for s in day_signals if s.status == SignalStatus.EXPIRED)
    pnl       = sum(s.pnl_pips or 0 for s in day_signals)
    total     = len(day_signals)
    win_rate  = tp_count / total if total else 0

    # Upsert (PostgreSQL)
    stmt = pg_insert(Performance).values(
        date=day_start,
        pair=pair.replace("_", "/"),
        signals_issued=total,
        tp_count=tp_count,
        sl_count=sl_count,
        expired_count=exp_count,
        pnl_pips=pnl,
        win_rate=win_rate,
    ).on_conflict_do_update(
        index_elements=["date", "pair"],
        set_={
            "signals_issued": total,
            "tp_count": tp_count,
            "sl_count": sl_count,
            "expired_count": exp_count,
            "pnl_pips": pnl,
            "win_rate": win_rate,
        }
    )
    await db.execute(stmt)
    await db.commit()
    logger.info(f"Performance updated for {pair} {for_date}: {tp_count}W/{sl_count}L, {pnl:+.0f} pips")


async def run_tracker():
    """Main tracker loop — call this from the scheduler every 15 minutes."""
    async with AsyncSessionLocal() as db:
        await close_expired_signals(db)
        for pair in settings.ACTIVE_PAIRS:
            await check_open_signals(db, pair)
            await update_daily_performance(db, pair)
